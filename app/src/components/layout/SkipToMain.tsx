export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className={[
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg',
        'focus:bg-white dark:focus:bg-zinc-800 focus:text-[--text-primary]',
        'focus:border focus:border-[--ucsi-border]',
        'focus:text-sm focus:font-medium',
      ].join(' ')}
    >
      Skip to main content
    </a>
  )
}
