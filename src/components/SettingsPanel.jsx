import { MoonStar } from 'lucide-react'

function ToggleRow({ icon: Icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`mt-0.5 ${enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${title} toggle`}
        onClick={onToggle}
        className="shrink-0 inline-flex items-center gap-2"
      >
        <span className={`text-[11px] font-bold tracking-wide ${enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
          {enabled ? 'ON' : 'OFF'}
        </span>
        <span
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            enabled ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </span>
      </button>
    </div>
  )
}

export default function SettingsPanel({ nightModeOn, onNightModeToggle }) {

  return (
    <section className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-xl">
        <div className="grid gap-3">
          <ToggleRow
            icon={MoonStar}
            title="Night mode"
            description="Switch between light and dark interface styles."
            enabled={nightModeOn}
            onToggle={() => onNightModeToggle((value) => !value)}
          />
        </div>
      </div>
    </section>
  )
}
