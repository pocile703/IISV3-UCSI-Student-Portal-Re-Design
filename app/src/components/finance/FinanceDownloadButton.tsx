'use client'

import { Download } from 'lucide-react'

interface FinanceDownloadButtonProps {
  filename: string
  content: string
  label: string
}

export function FinanceDownloadButton({ filename, content, label }: FinanceDownloadButtonProps) {
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      aria-label={label}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
    >
      <Download size={13} aria-hidden="true" />
      <span className="hidden sm:inline">Download</span>
    </button>
  )
}
