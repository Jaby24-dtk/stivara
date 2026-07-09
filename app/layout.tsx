import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stivara — Corporate Secretarial Platform',
  description: 'Run your corporate secretary function in-house: filings, compliance, governance, and AI assistance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  )
}
