'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { DEFAULT_THEME } from '@/schemas/theme'

// Dynamically import MatrixBackground to avoid SSR issues
const MatrixBackground = dynamic(
  () => import('@/components/matrix/MatrixBackground').then(mod => mod.MatrixBackground),
  { ssr: false }
)

const ASCII_LOGO = `
 _                                 _           _
| |_ ___ _ __ _ __ ___         __| | ___  ___| | __
| __/ _ \\ '__| '\` _ \\ _____ / _\` |/ _ \\/ __| |/ /
| ||  __/ |  | | | | | |_____| (_| |  __/ (__|   <
 \\__\\___|_|  |_| |_| |_|      \\__,_|\\___|\\___|_|\\_\\
`

export default function HomePage() {
  const [logo, setLogo] = useState(ASCII_LOGO)
  const [showCommands, setShowCommands] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Generate logo with figlet on mount (client-side only)
    const loadFiglet = async () => {
      try {
        const { generateBigText } = await import('@/lib/render/figlet-web')
        const text = await generateBigText('TERM-DECK')
        if (text) setLogo(text)
      } catch {
        // Keep fallback logo
      }
    }

    loadFiglet()

    // Delay showing commands for effect
    const timer = setTimeout(() => setShowCommands(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-cyber-bg">
      {/* Matrix rain background - only render on client */}
      {mounted && <MatrixBackground theme={DEFAULT_THEME} />}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <pre className="text-cyber-green neon-text text-xs sm:text-sm md:text-base mb-8 text-center overflow-hidden">
          {logo}
        </pre>

        {/* Tagline */}
        <p className="text-cyber-muted text-lg mb-12 text-center">
          Terminal presentations for the web
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link href="/upload" className="cyber-button">
            Upload Deck
          </Link>
          <Link href="/d/demo" className="cyber-button-orange">
            View Demo
          </Link>
        </div>

        {/* Terminal commands */}
        <div
          className={`cyber-window p-6 max-w-xl w-full transition-opacity duration-500 ${
            showCommands ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-cyber-muted text-sm mb-4">Quick Start</div>

          <div className="space-y-4 font-mono text-sm">
            <div>
              <div className="text-cyber-muted mb-1"># Install</div>
              <div className="text-cyber-green">
                $ <span className="text-white">npm install -g @pep/term-deck</span>
              </div>
            </div>

            <div>
              <div className="text-cyber-muted mb-1"># Create presentation</div>
              <div className="text-cyber-green">
                $ <span className="text-white">term-deck init my-deck</span>
              </div>
            </div>

            <div>
              <div className="text-cyber-muted mb-1"># Present in terminal</div>
              <div className="text-cyber-green">
                $ <span className="text-white">term-deck present ./my-deck</span>
              </div>
            </div>

            <div>
              <div className="text-cyber-muted mb-1"># Play from URL</div>
              <div className="text-cyber-green">
                $ <span className="text-white">npx @pep/term-deck play https://term-deck-web.vercel.app/d/demo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-16 flex gap-8 text-cyber-muted text-sm">
          <a
            href="https://github.com/PepijnSenders/term-deck"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-green transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@pep/term-deck"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-green transition-colors"
          >
            npm
          </a>
        </div>
      </div>

      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines z-20 opacity-30" />
    </div>
  )
}
