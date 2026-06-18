'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'

type Theme = 'system' | 'light' | 'dark'

const ORDER: Theme[] = ['system', 'light', 'dark']
const THEME_EVENT = 'ucsi-theme-change'

function resolveStoredTheme(value: string | null): Theme {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme:dark)')

  window.addEventListener('storage', onStoreChange)
  window.addEventListener(THEME_EVENT, onStoreChange)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(THEME_EVENT, onStoreChange)
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

function getSnapshot(): Theme {
  return resolveStoredTheme(localStorage.getItem('theme'))
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => 'system')

  // On mount: if no explicit preference is stored, apply dark class based on OS preference.
  // Read localStorage directly — the closure `theme` is captured from the hydration render
  // where useSyncExternalStore uses the server snapshot ('system'), not the client value.
  // Reading localStorage at effect runtime avoids that stale-closure bug.
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      const mq = window.matchMedia('(prefers-color-scheme:dark)')
      document.documentElement.classList.toggle('dark', mq.matches)
      document.documentElement.classList.remove('light')
    }
  }, [])

  function applyTheme(next: Theme) {
    const root = document.documentElement
    if (next === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      localStorage.setItem('theme', 'dark')
      document.cookie = 'theme=dark; path=/; max-age=31536000; SameSite=Lax'
    } else if (next === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      document.cookie = 'theme=light; path=/; max-age=31536000; SameSite=Lax'
    } else {
      root.classList.remove('dark', 'light')
      localStorage.removeItem('theme')
      document.cookie = 'theme=; path=/; max-age=0; SameSite=Lax'
      if (window.matchMedia('(prefers-color-scheme:dark)').matches) root.classList.add('dark')
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  const cycle = () => applyTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const label = `${theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'} mode — click to change`

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}
