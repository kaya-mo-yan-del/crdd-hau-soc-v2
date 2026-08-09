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
import { formatDisplayDate, getAvailableDates, getDefaultSelectedDate } from '../data/detections'

function CustomTooltip({ active, payload, label, isNightMode = false }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div className={`text-xs rounded-lg px-3 py-2 shadow-lg ${isNightMode ? 'bg-black text-gray-100 border border-white/10' : 'bg-gray-900 text-white'}`}>
      <p className={`${isNightMode ? 'text-gray-400' : 'text-white/70'} mb-0.5`}>{label}</p>
      <p className="font-semibold">
        {value} respiratory distress event{value === 1 ? '' : 's'}
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

export default function CoughChart({ records = [], nightModeOn = false }) {
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

  const chartTone = nightModeOn
    ? {
        line: '#88b6a1',
        fill: '#88b6a1',
        grid: '#2f3935',
        tick: '#99a8a1',
        peakLabel: '#e6ece9',
      }
    : {
        line: '#74b98f',
        fill: '#74b98f',
        grid: '#e5e7eb',
        tick: '#6b7280',
        peakLabel: '#111827',
      }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Respiratory distress activity</h2>
          <p className="text-sm text-gray-500 mt-1">Hourly respiratory distress detections over time</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-3">
          <label className="text-sm font-medium text-gray-700">
            <select
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-white outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {availableDates.map(dateValue => (
                <option key={dateValue} value={dateValue}>
                  {formatDisplayDate(dateValue)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 rounded text-xs font-medium text-gray-700 bg-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Detected</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 mt-6">
        {selectedDate ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fullDayRecords} margin={{ top: 16, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="coughFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTone.fill} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartTone.fill} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke={chartTone.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: chartTone.tick }}
                interval="preserveStartEnd"
                minTickGap={22}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: chartTone.tick }}
                width={34}
                domain={[0, yAxisMax]}
                ticks={yAxisTicks}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip isNightMode={nightModeOn} />} />

              <Area
                type="monotone"
                dataKey="coughs"
                stroke={chartTone.line}
                strokeWidth={2.5}
                fill="url(#coughFill)"
                dot={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: chartTone.line }}
              />

              {peakPoint ? (
                <ReferenceDot
                  x={peakPoint.time}
                  y={peakPoint.coughs}
                  r={5}
                  fill={chartTone.line}
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: `Peak distress · ${peakPoint.coughs}`,
                    position: 'top',
                    fill: chartTone.peakLabel,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
            No saved respiratory distress data yet.
          </div>
        )}
      </div>
    </section>
  )
}
