import { NAV_CONFIG } from '@/lib/nav'
import { NavGroup } from './NavGroup'
import { NavItem } from './NavItem'
import type { Role } from '@/types/user'

interface SidebarNavProps {
  role: Role
  collapsed?: boolean
}

export function SidebarNav({ role, collapsed = false }: SidebarNavProps) {
  const config = NAV_CONFIG[role]

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-1 flex-col justify-between overflow-y-auto px-2 py-2"
    >
      <div className="flex flex-col gap-1">
        {config.groups.map((group) => (
          <NavGroup key={group.label} label={group.label} collapsed={collapsed}>
            {group.items.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </NavGroup>
        ))}
      </div>

      <div className="flex flex-col gap-1 border-t border-[--sidebar-nav-border] pt-2">
        {config.pinned.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  )
}
