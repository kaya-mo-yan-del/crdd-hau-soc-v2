import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { alerts } from '../data/mockData'

const severityStyles = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    iconClass: 'text-critical fill-critical/15',
    badgeClass: 'text-critical bg-criticalSoft',
  },
  moderate: {
    label: 'Moderate',
    icon: AlertTriangle,
    iconClass: 'text-moderate',
    badgeClass: 'text-moderate bg-moderateSoft',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    iconClass: 'text-success',
    badgeClass: 'text-success bg-successSoft',
  },
}

export default function AlertsList() {
  return (
    <div className="bg-surface rounded-xl2 shadow-card mt-4 sm:mt-5">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display font-semibold text-base">Recent critical alerts</h2>
        <button className="text-xs font-semibold text-muted hover:text-ink transition-colors">
          View all
        </button>
      </div>

      <ul>
        {alerts.map((alert, i) => {
          const style = severityStyles[alert.severity]
          const Icon = style.icon
          const isLast = i === alerts.length - 1
          return (
            <li
              key={alert.id}
              className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 sm:px-6 py-4 ${!isLast ? 'border-b border-line' : ''}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className={`mt-0.5 ${style.iconClass}`}>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{alert.title}</p>
                  <p className="text-xs text-muted mt-0.5 font-mono break-words">
                    {alert.location} · {alert.time}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badgeClass}`}>
                  {style.label}
                </span>
                {alert.status === 'unreviewed' ? (
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-semibold text-ink border border-line rounded-lg px-3 py-1.5 hover:bg-bg transition-colors whitespace-nowrap">
                      Mark reviewed
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted font-medium">Reviewed</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
