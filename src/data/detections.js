import { supabase, getAudioUrl } from '../lib/supabaseClient'

export const ALERT_THRESHOLD = 3

const MANILA_TZ = 'Asia/Manila'

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
export const aggregateEventsByHour = events => {
  const buckets = new Map()

  events.forEach(event => {
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
