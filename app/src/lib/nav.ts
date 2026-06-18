import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
  MessageSquare,
  UserCircle,
  Users,
  BookMarked,
  CalendarDays,
  FolderOpen,
  ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/user'

export interface NavItemConfig {
  label: string
  href: string
  icon: LucideIcon
  matchExact?: boolean
}

export interface NavGroupConfig {
  label: string
  items: NavItemConfig[]
}

export interface RoleNavConfig {
  groups: NavGroupConfig[]
  pinned: NavItemConfig[]
}

export const NAV_CONFIG: Record<Role, RoleNavConfig> = {
  student: {
    groups: [
      {
        label: 'Student',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, matchExact: true },
          { label: 'Academic',  href: '/academic',  icon: GraduationCap },
          { label: 'Timetable', href: '/timetable', icon: Calendar },
          { label: 'Classes',   href: '/classes',   icon: BookOpen },
          { label: 'Financial', href: '/finance',   icon: CreditCard },
          { label: 'Feedback',  href: '/feedback',  icon: MessageSquare },
        ],
      },
    ],
    pinned: [
      { label: 'Profile', href: '/profile', icon: UserCircle },
    ],
  },

  lecturer: {
    groups: [
      {
        label: 'Lecturer',
        items: [
          { label: 'Dashboard',   href: '/lecturer',            icon: LayoutDashboard, matchExact: true },
          { label: 'My Classes',  href: '/lecturer/resources',  icon: BookOpen },
          { label: 'Attendance',  href: '/lecturer/attendance', icon: ClipboardList },
          { label: 'Timetable',   href: '/lecturer/timetable',  icon: Calendar },
        ],
      },
    ],
    pinned: [
      { label: 'Profile', href: '/lecturer/profile', icon: UserCircle },
    ],
  },

  admin: {
    groups: [
      {
        label: 'Admin',
        items: [
          { label: 'Dashboard',  href: '/admin',            icon: LayoutDashboard, matchExact: true },
          { label: 'Users',      href: '/admin/users',      icon: Users },
          { label: 'Programmes', href: '/admin/programmes', icon: BookMarked },
          { label: 'Sections',   href: '/admin/sections',   icon: CalendarDays },
          { label: 'Resources',  href: '/admin/resources',  icon: FolderOpen },
          { label: 'Posts',      href: '/admin/posts',      icon: MessageSquare },
        ],
      },
    ],
    pinned: [
      { label: 'Profile', href: '/admin/profile', icon: UserCircle },
    ],
  },
}
