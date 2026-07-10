import { useMemo } from 'react'
import { MapPin, Cpu } from 'lucide-react'
import { computeSummary } from '../data/detections'

function Stat({ label, value, tone = 'neutral' }) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'success'
      ? 'text-success'
      : 'text-white'
  return (
    <div className="bg-sidebarSoft/60 rounded-xl2 px-4 py-3">
      <p className={`font-display font-semibold text-2xl leading-none ${toneClass}`}>{value}</p>
      <p className="text-xs text-white/55 mt-1.5">{label}</p>
    </div>
  )
}

export default function SummaryPanel({ records = [] }) {
  // Recomputed every time a new detection record is stored, so the summary
  // panel reflects each incoming record immediately, same as the chart and
  // detection history.
  const summary = useMemo(() => computeSummary(records), [records])
  const alertRatePct = summary.totalCycles > 0
    ? Math.round((summary.flaggedCycles / summary.totalCycles) * 100)
    : 0

  return (
    <aside className="w-full xl:w-72 shrink-0 bg-sidebar text-white rounded-xl2 p-4 sm:p-5 lg:p-6 h-fit mt-0 xl:mt-5">
      <h2 className="font-display font-semibold text-sm text-white/70 mb-5">
        Detection summary
      </h2>

      {/* Alert rate — number + plain-language readout together */}
      <div className="flex items-center gap-4 mb-2">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="-rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#2A3931" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#C0473B"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - alertRatePct / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-semibold text-lg">{alertRatePct}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold leading-snug">Alert rate</p>
          <p className="text-xs text-white/55 leading-snug mt-0.5">
            {summary.flaggedCycles} of {summary.totalCycles} detection cycles
            flagged today
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 my-5" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Stat label="Alerts today" value={summary.alertsToday} tone="critical" />
        <Stat label="Device status" value="Active" tone="success" />
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-white/60">
        <p className="flex items-center gap-2">
          <MapPin size={13} /> {summary.location}
        </p>
        <p className="flex items-center gap-2">
          <Cpu size={13} /> {summary.device}
        </p>
      </div>
    </aside>
  )
}
