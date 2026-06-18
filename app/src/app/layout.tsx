import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'UCSI Student Portal',
  description: 'UCSI College student portal — academic, financial, and learning resources.',
}

// Cookie-based theme: ThemeToggle writes `theme=dark|light` (or deletes) on every toggle.
// Server reads it here and applies the class before React hydrates — no <script> needed.
// System mode (no cookie): CSS @media (prefers-color-scheme: dark) handles the fallback.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const themeClass = themeCookie === 'dark' ? ' dark' : themeCookie === 'light' ? ' light' : ''

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${themeClass}`}
    >
      <body className="h-full">
        {children}
      </body>
    </html>
  )
}
