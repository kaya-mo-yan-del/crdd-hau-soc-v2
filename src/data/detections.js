import { supabase, getAudioUrl } from '../lib/supabaseClient'

export const ALERT_THRESHOLD = 3

// ---------------------------------------------------------------------------
// Source of truth: individual Sick-detection EVENTS, read live from Supabase.
//
// Every row in `detections` is exactly one respiratory-distress detection,
// timestamped to the millisecond (Philippine time). Two derived views are
// built from the resulting event list, same as the old mock data always
// worked:
//   - Detection History: shows every event as its own row (event log).
//   - Graph: groups events into per-hour totals (see aggregateEventsByHour).
// ---------------------------------------------------------------------------

const MANILA_TZ = 'Asia/Manila'

// Splits a Postgres timestamptz (returned as a UTC ISO string) into the same
// { date: 'YYYY-MM-DD', time: 'HH:MM:SS.mmm' } shape the UI has always used,
// rendered in Philippine time regardless of the viewer's own browser/server
// timezone.
function toManilaDateTime(isoString) {
  const parsed = new Date(isoString)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(parsed)

  const get = type => parts.find(p => p.type === type)?.value ?? '00'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const ms = String(parsed.getMilliseconds()).padStart(3, '0')
  const time = `${get('hour')}:${get('minute')}:${get('second')}.${ms}`

  return { date, time }
}

// "Today" as seen in the Philippines, not the viewer's local browser date —
// matters near midnight if the dashboard is ever opened from another timezone.
function getManilaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(new Date())
}

function mapRowToEvent(row) {
  const { date, time } = toManilaDateTime(row.detected_at)

  return {
    id: row.id,
    date,
    time,
    coughs: 1,
    confidence: row.confidence,
    audioFileName: row.audio_path?.split('/').pop() ?? 'unknown.wav',
    audioDuration: '00:05', // every clip is a fixed 5-second window
    audioUrl: getAudioUrl(row.audio_path),
    reviewedLabel: row.reviewed_label ?? null,
  }
}

// Lets farm staff manually confirm/correct a detection as 'None' (false
// alarm) or 'Distress' (confirmed). Throws on failure so the caller can
// roll back its optimistic UI update.
export async function updateReviewedLabel(id, label) {
  const { error } = await supabase
    .from('detections')
    .update({ reviewed_label: label })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// Loads every Sick detection currently in Supabase, oldest first.
export async function fetchDetectionEvents() {
  const { data, error } = await supabase
    .from('detections')
    .select('*')
    .order('detected_at', { ascending: true })

  if (error) {
    console.error('Failed to load detections:', error.message)
    return []
  }

  return (data ?? []).map(mapRowToEvent)
}

// Subscribes to new Sick detections as the Pi uploads them in real time.
// Calls onNewEvent(event) for each new row, in the same shape
// fetchDetectionEvents() returns. Returns an unsubscribe function.
export function subscribeToDetectionEvents(onNewEvent) {
  const channel = supabase
    .channel('detections-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'detections' },
      payload => onNewEvent(mapRowToEvent(payload.new))
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ---------------------------------------------------------------------------
// Device status: the Pi updates a single `device_status` row's `last_seen`
// every detection cycle (~5-8s). If we haven't heard from it recently, we
// treat it as offline — this is what makes the header's status live instead
// of a hardcoded "active" label.
// ---------------------------------------------------------------------------
const DEVICE_OFFLINE_AFTER_MS = 20_000 // a bit more than 2 missed cycles

export async function fetchDeviceLastSeen() {
  const { data, error } = await supabase
    .from('device_status')
    .select('last_seen')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) {
    console.error('Failed to load device status:', error?.message)
    return null
  }

  return data.last_seen
}

// Subscribes to heartbeat updates as they arrive. Calls onUpdate(last_seen)
// each time the Pi checks in. Returns an unsubscribe function.
export function subscribeToDeviceStatus(onUpdate) {
  const channel = supabase
    .channel('device-status-live')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'device_status' },
      payload => onUpdate(payload.new.last_seen)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// Pure function: given the last known heartbeat, is the device online right
// now? Kept separate so a component can re-evaluate this on a timer even
// when no new heartbeat has arrived (i.e. to actually notice a Pi going
// offline, not just notice it coming back online).
export function isDeviceOnline(lastSeenIso) {
  if (!lastSeenIso) return false
  return Date.now() - new Date(lastSeenIso).getTime() < DEVICE_OFFLINE_AFTER_MS
}

// ---------------------------------------------------------------------------
// Pure helpers — unchanged in behavior from the original mock data module.
// They just shape/aggregate whatever event list they're given.
// ---------------------------------------------------------------------------

export const formatDisplayDate = dateValue => {
  const parsedDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

// Groups individual detection events into per-hour totals, in the same
// { date, time: "HH:00", coughs } shape the graph has always expected.
// A detection reviewed as 'None' (a vet ruling out a false alarm) is
// excluded from the count; 'Distress' (or not-yet-reviewed) still counts —
// so correcting the label immediately raises or lowers the graph and peak.
export const aggregateEventsByHour = events => {
  const buckets = new Map()

  events
    .filter(event => event.reviewedLabel !== 'None')
    .forEach(event => {
      const hour = event.time.slice(0, 2)
      const key = `${event.date}T${hour}`

      if (!buckets.has(key)) {
        buckets.set(key, { date: event.date, time: `${hour}:00`, coughs: 0 })
      }

      buckets.get(key).coughs += 1
    })

  return Array.from(buckets.values()).sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  )
}

export const getAvailableDates = records => [...new Set(records.map(record => record.date))].sort((left, right) =>
  right.localeCompare(left)
)

export const getDefaultSelectedDate = records => {
  const today = getManilaToday()
  const availableDates = getAvailableDates(records)

  if (availableDates.includes(today)) {
    return today
  }

  return availableDates[0] ?? today
}

export const getPeakPoint = records => records.reduce((max, point) =>
  point.coughs > max.coughs ? point : max
, records[0])

// Builds summary stats from hourly-aggregated records for the "current" day
// — today's date (Philippine time) if any records exist for it yet,
// otherwise the most recent date with data.
export const computeSummary = hourlyRecords => {
  const targetDate = getDefaultSelectedDate(hourlyRecords)
  const dayRecords = hourlyRecords.filter(record => record.date === targetDate)
  const flaggedCycles = dayRecords.filter(record => record.coughs >= ALERT_THRESHOLD).length
  const peak = dayRecords.length ? getPeakPoint(dayRecords) : null

  return {
    alertsToday: flaggedCycles,
    peakCoughsPerHr: peak ? peak.coughs : 0,
    clearHouses: 1,
    totalHouses: 4,
    threshold: ALERT_THRESHOLD,
    flaggedCycles,
    totalCycles: dayRecords.length,
    location: 'Magalang Poultry',
    device: 'Raspberry Pi 4',
  }
}
