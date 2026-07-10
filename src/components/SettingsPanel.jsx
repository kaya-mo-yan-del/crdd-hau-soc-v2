import { useState } from 'react'
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

export default function SettingsPanel({ nightModeOn, onNightModeToggle }) {

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

      <div className="mb-5 rounded-xl2 bg-sidebarSoft px-4 py-4 text-sm text-white">
        <p className="font-semibold">Device status</p>
        <p className="text-white/70 text-xs mt-1">Device is active and still receiving audio.</p>
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