import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'term-deck - Terminal Presentations for the Web',
  description: 'Share cyberpunk terminal presentations online. Create, share, and present with Matrix-style aesthetics.',
  keywords: ['terminal', 'presentation', 'slides', 'cyberpunk', 'matrix', 'cli'],
  authors: [{ name: 'Pepijn Senders' }],
  openGraph: {
    title: 'term-deck',
    description: 'Terminal presentations for the web',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
