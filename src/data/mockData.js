const dayOne = '2024-11-10'
const dayTwo = '2024-11-11'

const pad = value => String(value).padStart(2, '0')

// ---------------------------------------------------------------------------
// Source of truth: individual cough-detection EVENTS.
//
// Every entry here is exactly one detected cough, timestamped to the
// millisecond. Nothing is pre-aggregated. Two derived views are built from
// this list:
//   - Detection History: shows every event as its own row (event log).
//   - Graph: groups events into per-hour totals (see aggregateEventsByHour).
// ---------------------------------------------------------------------------

// Hourly totals used only to seed realistic historical demo data below.
// (Not exported — real historical events are expanded from this.)
const seedHourlyTotals = [
  [dayOne, '00', 0], [dayOne, '01', 0], [dayOne, '02', 1], [dayOne, '03', 1],
  [dayOne, '04', 2], [dayOne, '05', 2], [dayOne, '06', 1], [dayOne, '07', 3],
  [dayOne, '08', 5], [dayOne, '09', 6], [dayOne, '10', 4], [dayOne, '11', 3],
  [dayTwo, '12', 2], [dayTwo, '13', 3], [dayTwo, '14', 4], [dayTwo, '15', 5],
  [dayTwo, '16', 7], [dayTwo, '17', 8], [dayTwo, '18', 6], [dayTwo, '19', 4],
  [dayTwo, '20', 3], [dayTwo, '21', 2], [dayTwo, '22', 1], [dayTwo, '23', 0],
]

const buildHistoricalEvents = () => {
  const events = []

  seedHourlyTotals.forEach(([date, hour, coughCount]) => {
    // No entries are created for hours with zero detections — only real
    // detections become history records.
    for (let i = 0; i < coughCount; i += 1) {
      const minute = Math.min(59, 2 + i * Math.floor(56 / Math.max(coughCount, 1)))
      const second = (i * 17) % 60
      const millisecond = (i * 137) % 1000
      const time = `${hour}:${pad(minute)}:${pad(second)}.${String(millisecond).padStart(3, '0')}`

      events.push({
        id: `${date}-${hour}-${i}`,
        date,
        time,
        coughs: 1,
        audioFileName: `resp-distress-${hour}-${pad(minute)}-${pad(second)}.wav`,
        audioDuration: `00:0${6 + (i % 4)}`,
      })
    }
  })

  return events
}

export const coughEvents = buildHistoricalEvents()

export const ALERT_THRESHOLD = 3

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

// Groups individual cough events into per-hour totals, in the same
// { date, time: "HH:00", coughs } shape the graph has always expected. The
// graph keeps aggregating per hour even though the underlying event log is
// now granular to the millisecond.
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
  const today = new Date().toISOString().slice(0, 10)
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
// — today's date if any records exist for it yet, otherwise the most recent
// date with data.
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

export const summary = computeSummary(aggregateEventsByHour(coughEvents))

// Roughly how often a live feed "tick" actually corresponds to a real cough
// being detected. Ticks that don't detect anything create no record at all —
// zero-count entries are never written to history.
const COUGH_DETECTION_PROBABILITY = 0.55

// Simulates ONE live cough-detection event, or no event at all if nothing
// was detected on this tick. Returns null when there's nothing to record —
// callers must skip storing anything in that case. In production this is
// replaced by whatever pushes real detections from the Raspberry Pi
// (WebSocket message, SSE event, MQTT message, etc.), fired once per actual
// detected cough.
export const createIncomingCoughEvent = () => {
  if (Math.random() > COUGH_DETECTION_PROBABILITY) {
    return null
  }

  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`
  const audioSeconds = 6 + Math.floor(Math.random() * 4)

  return {
    id: `${date}T${time}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    time,
    coughs: 1,
    audioFileName: `resp-distress-${time.replace(/[:.]/g, '-')}.wav`,
    audioDuration: `00:${pad(audioSeconds)}`,
  }
}

export const alerts = [
  {
    id: 'a1',
    severity: 'critical',
    title: 'Abnormal respiratory distress activity',
    location: 'Magalang Poultry',
    time: '09:05',
    status: 'unreviewed',
  },
  {
    id: 'a2',
    severity: 'moderate',
    title: 'Consecutive respiratory distress alert',
    location: 'Magalang Poultry',
    time: '10:56',
    status: 'unreviewed',
  },
  {
    id: 'a3',
    severity: 'resolved',
    title: 'Respiratory distress spike returned to baseline',
    location: 'Magalang Poultry',
    time: '11:40',
    status: 'reviewed',
  },
]
