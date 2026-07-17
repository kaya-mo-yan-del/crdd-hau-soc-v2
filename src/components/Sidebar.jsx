import { LayoutDashboard, Settings } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="w-full md:w-60 shrink-0 bg-sidebar text-white flex flex-col md:fixed md:inset-y-0 md:left-0 md:z-20 md:h-screen md:overflow-y-auto border-b md:border-b-0 md:border-r border-white/10">
      <div className="flex items-center gap-3 px-4 sm:px-6 pt-5 sm:pt-6 md:pt-8 pb-4 sm:pb-5 md:pb-6">
        <div className="w-11 h-11 rounded-full border-2 border-accent/60 bg-sidebarSoft flex items-center justify-center font-display font-semibold text-sm text-white">
          A
        </div>
        <div>
          <p className="font-display font-semibold text-sm leading-tight">ABC Farm</p>
          <p className="text-xs text-white/50 leading-tight">Magalang, Pampanga</p>
        </div>
      </div>

      <nav className="flex gap-2 px-3 mt-1 md:mt-2 pb-3 md:pb-0 overflow-x-auto md:overflow-visible md:flex-col md:gap-1" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap md:whitespace-normal min-w-max md:min-w-0
                ${isActive
                  ? 'bg-white text-sidebar'
                  : 'text-white/70 hover:bg-sidebarSoft hover:text-white'}`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </nav>

    </aside>
  )
}
