import { useEffect, useState } from 'react'
import { Cpu, MoonStar } from 'lucide-react'

function ToggleRow({ icon: Icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl2 border border-line bg-surface px-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`mt-0.5 ${enabled ? 'text-success' : 'text-muted'}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          enabled
            ? 'bg-successSoft text-success'
            : 'bg-bg text-muted hover:text-ink'
        }`}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

// "5 seconds ago" / "2 minutes ago" style text, from an ISO timestamp.
function formatRelativeTime(isoString) {
  if (!isoString) return null
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

const STATUS_STYLES = {
  online: { bg: 'bg-successSoft', text: 'text-success', dot: 'bg-success', label: 'Online' },
  offline: { bg: 'bg-criticalSoft', text: 'text-critical', dot: 'bg-critical', label: 'Offline' },
  checking: { bg: 'bg-sidebarSoft', text: 'text-white/70', dot: 'bg-white/40 animate-pulse', label: 'Checking…' },
}

export default function SettingsPanel({ nightModeOn, onNightModeToggle, deviceStatus = 'checking', deviceLastSeen = null }) {
  // Re-render once a second so "X seconds ago" stays accurate while this
  // panel is open, without needing a fresh heartbeat to arrive.
  const [, forceTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => forceTick(tick => tick + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const style = STATUS_STYLES[deviceStatus] ?? STATUS_STYLES.checking
  const relativeTime = formatRelativeTime(deviceLastSeen)
  const isDarkBlock = deviceStatus === 'checking'

  return (
    <section className="bg-surface rounded-xl2 shadow-card p-4 sm:p-5 lg:p-6 mt-4 sm:mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-5">
        <div>
          <h2 className="font-display font-semibold text-base">System settings</h2>
          <p className="text-xs text-muted mt-0.5">
            Control device status, alerts, and monitoring behavior.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted font-medium">
          <Cpu size={13} /> Raspberry Pi 4
        </div>
      </div>

      <div className={`mb-5 rounded-xl2 px-4 py-4 text-sm ${style.bg} ${isDarkBlock ? 'text-white' : ''}`}>
        <p className={`font-semibold flex items-center gap-2 ${isDarkBlock ? 'text-white' : style.text}`}>
          <span className={`w-2 h-2 rounded-full inline-block ${style.dot}`} />
          Device status · {style.label}
        </p>
        <p className={`text-xs mt-1 ${isDarkBlock ? 'text-white/70' : style.text}`}>
          {deviceStatus === 'checking' && 'Waiting for the first check-in…'}
          {deviceStatus === 'online' && (relativeTime ? `Last check-in: ${relativeTime}` : 'Actively receiving audio.')}
          {deviceStatus === 'offline' && (relativeTime ? `No check-in for ${relativeTime}` : 'No check-in received yet.')}
        </p>
      </div>

      <div className="grid gap-3">
        <ToggleRow
          icon={MoonStar}
          title="Night mode"
          description="Reduce alert intensity and soften the interface during late hours."
          enabled={nightModeOn}
          onToggle={() => onNightModeToggle((value) => !value)}
        />
      </div>
    </section>
  )
}
