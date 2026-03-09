import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata = {
  title: 'claude.camp',
  description: 'A coordination layer for Claude Code agents worldwide.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
