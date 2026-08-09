import { LayoutDashboard, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Theme', icon: Moon },
]

const STATUS_STYLES = {
  checking: {
    text: 'Checking...',
    textClass: 'text-amber-600',
    dotClass: 'bg-amber-500',
  },
  online: {
    text: 'Online',
    textClass: 'text-emerald-600',
    dotClass: 'bg-emerald-500',
  },
  offline: {
    text: 'Offline',
    textClass: 'text-red-600',
    dotClass: 'bg-red-500',
  },
}

function formatRelativeTime(isoString) {
  if (!isoString) return null
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Sidebar({ active, onNavigate, deviceStatus = 'checking', deviceLastSeen = null }) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => forceTick(tick => tick + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const status = STATUS_STYLES[deviceStatus] ?? STATUS_STYLES.checking
  const relativeTime = formatRelativeTime(deviceLastSeen)
  const statusDetail = deviceStatus === 'checking'
    ? 'Waiting for first check-in...'
    : deviceStatus === 'online'
      ? (relativeTime ? `Last check-in: ${relativeTime}` : 'Receiving heartbeats normally.')
      : (relativeTime ? `No check-in for ${relativeTime}` : 'No check-in received yet.')

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 fixed inset-y-0 left-0 z-20 h-screen">
        <div className="p-6">
          <h1 className="text-xl font-bold text-emerald-600 leading-tight">ABC Farm</h1>
          <p className="text-sm text-gray-500 mt-1">Magalang, Pampanga</p>
        </div>

        <nav className="flex-1 px-4 md:space-y-2 mt-4" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 text-left rounded-l-md
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
              >
                <Icon size={18} strokeWidth={2} className="w-5" />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="p-4">
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <p className="text-xs text-gray-600 font-medium mb-2">Raspberry Pi 4 · Audio node</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
              <span className={status.textClass}>{status.text}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{statusDetail}</p>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 flex items-center justify-around" aria-label="Mobile navigation">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 max-w-[180px] flex flex-col items-center gap-1 py-2 border-b-2 text-xs font-semibold transition-colors
                ${isActive
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-gray-500'}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
