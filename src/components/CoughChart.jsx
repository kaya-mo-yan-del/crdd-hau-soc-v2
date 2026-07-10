import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import { ALERT_THRESHOLD, formatDisplayDate, getAvailableDates, getDefaultSelectedDate, getPeakPoint } from '../data/detections'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const overThreshold = value >= ALERT_THRESHOLD
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg font-mono">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-semibold">
        {value} respiratory distress events
        {overThreshold && <span className="text-accent"> · above threshold</span>}
      </p>
    </div>
  )
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
  const selectedRecords = useMemo(
    () => records.filter(record => record.date === selectedDate),
    [records, selectedDate]
  )
  const peakPoint = useMemo(
    () => (selectedRecords.length ? getPeakPoint(selectedRecords) : null),
    [selectedRecords]
  )

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
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-3 h-[2px] bg-critical inline-block" style={{ borderTop: '2px dashed #C0473B', background: 'none' }} />
              Alert threshold ({ALERT_THRESHOLD})
            </span>
          </div>
        </div>
      </div>

      <div className="h-56 sm:h-64 mt-4">
        {selectedRecords.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={selectedRecords} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
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
                tick={{ fontSize: 11, fill: '#7C8983', fontFamily: 'IBM Plex Mono' }}
                interval={0}
                minTickGap={18}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#7C8983', fontFamily: 'IBM Plex Mono' }}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={ALERT_THRESHOLD}
                stroke="#C0473B"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Alert threshold · ${ALERT_THRESHOLD}`,
                  position: 'insideTopRight',
                  fill: '#C0473B',
                  fontSize: 11,
                  fontFamily: 'IBM Plex Mono',
                  fontWeight: 600,
                }}
              />

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
            No saved cough data for this date.
          </div>
        )}
      </div>
    </div>
  )
}
