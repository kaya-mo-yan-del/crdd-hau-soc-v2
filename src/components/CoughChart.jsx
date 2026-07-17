import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import { ALERT_THRESHOLD, formatDisplayDate, getAvailableDates, getDefaultSelectedDate } from '../data/detections'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const overThreshold = value >= ALERT_THRESHOLD
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg font-mono">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-semibold">
        {value} respiratory distress event{value === 1 ? '' : 's'}
        {overThreshold && <span className="text-accent"> · above threshold</span>}
      </p>
    </div>
  )
}

// Fills in every hour of the day (00:00–23:00) for the selected date, so the
// graph always reads as a full daily timeline instead of only plotting the
// scattered hours that happened to have a detection.
function buildFullDayRecords(date, hourlyRecords) {
  const countByHour = new Map(hourlyRecords.map(record => [record.time, record.coughs]))

  return Array.from({ length: 24 }, (_, hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`
    return { date, time, coughs: countByHour.get(time) ?? 0 }
  })
}

// Y-axis always shows at least 0–5. Once the tallest bar exceeds the current
// ceiling, the ceiling grows in steps of 5 (5 → 10 → 15 …) so there's always
// headroom above the data, and ticks stay on whole numbers (5 gridlines,
// each a whole-number step — never a fractional "half a cough").
function computeYAxisMax(maxValue) {
  if (maxValue <= 5) return 5
  const rounded = Math.ceil(maxValue / 5) * 5
  return rounded === maxValue ? rounded + 5 : rounded
}

export default function CoughChart({ records = [] }) {
  const [selectedDate, setSelectedDate] = useState(() => getDefaultSelectedDate(records))

  useEffect(() => {
    if (!records.length) return

    const availableDates = getAvailableDates(records)

    setSelectedDate(previousDate => {
      if (availableDates.includes(previousDate)) {
        return previousDate
      }

      return getDefaultSelectedDate(records)
    })
  }, [records])

  const availableDates = useMemo(() => getAvailableDates(records), [records])

  const dayRecords = useMemo(
    () => records.filter(record => record.date === selectedDate),
    [records, selectedDate]
  )

  const fullDayRecords = useMemo(
    () => (selectedDate ? buildFullDayRecords(selectedDate, dayRecords) : []),
    [selectedDate, dayRecords]
  )

  const maxCoughs = useMemo(
    () => fullDayRecords.reduce((max, record) => Math.max(max, record.coughs), 0),
    [fullDayRecords]
  )

  const yAxisMax = computeYAxisMax(maxCoughs)
  const yAxisTicks = useMemo(() => {
    const step = yAxisMax / 5
    return [0, step, step * 2, step * 3, step * 4, yAxisMax]
  }, [yAxisMax])

  const peakPoint = useMemo(() => {
    if (!maxCoughs) return null
    return fullDayRecords.find(record => record.coughs === maxCoughs) ?? null
  }, [fullDayRecords, maxCoughs])

  return (
    <div className="bg-surface rounded-xl2 shadow-card p-4 sm:p-5 lg:p-6 mt-4 sm:mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-1">
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-base">Respiratory distress activity</h2>
          <p className="text-xs text-muted mt-0.5">
            {selectedDate ? formatDisplayDate(selectedDate) : 'No saved data yet'}
          </p>
          <p className="text-xs text-muted mt-0.5">Hourly respiratory distress detections over time</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Date
            <select
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm font-medium text-ink shadow-sm outline-none transition-colors focus:border-accent"
            >
              {availableDates.map(dateValue => (
                <option key={dateValue} value={dateValue}>
                  {formatDisplayDate(dateValue)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Detected
            </span>
          </div>
        </div>
      </div>

      <div className="h-56 sm:h-64 mt-4">
        {selectedDate ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fullDayRecords} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coughFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9A441" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#D9A441" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="#E7E3D8" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#7C8983', fontFamily: 'IBM Plex Mono' }}
                interval={1}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#7C8983', fontFamily: 'IBM Plex Mono' }}
                width={28}
                domain={[0, yAxisMax]}
                ticks={yAxisTicks}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="coughs"
                stroke="#D9A441"
                strokeWidth={2.5}
                fill="url(#coughFill)"
                dot={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#D9A441' }}
              />

              {peakPoint ? (
                <ReferenceDot
                  x={peakPoint.time}
                  y={peakPoint.coughs}
                  r={5}
                  fill="#C0473B"
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: `Peak distress · ${peakPoint.coughs}`,
                    position: 'top',
                    fill: '#1B231F',
                    fontSize: 11,
                    fontFamily: 'IBM Plex Mono',
                    fontWeight: 600,
                  }}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-xl border border-dashed border-line bg-bg/60 flex items-center justify-center text-sm text-muted">
            No saved respiratory distress data yet.
          </div>
        )}
      </div>
    </div>
  )
}
