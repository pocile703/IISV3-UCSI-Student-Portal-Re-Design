// Loading-skeleton primitive. Animated placeholder block used by route-level
// loading.tsx files. Uses an inline --bg-elevated background (Tailwind v4
// arbitrary CSS-var classes are unreliable) so it reads against --bg-surface cards.

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ backgroundColor: 'var(--bg-elevated)' }}
      aria-hidden="true"
    />
  )
}
