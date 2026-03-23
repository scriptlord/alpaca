import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bell, Settings, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card max-md:w-14" aria-label="Main navigation">
      <div className="flex h-14 items-center justify-center border-b border-border px-4">
        <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="max-md:hidden">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
