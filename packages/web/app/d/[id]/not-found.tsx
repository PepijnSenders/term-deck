import Link from 'next/link'
import { MatrixBackground } from '@/components/matrix'
import { DEFAULT_THEME } from '@/schemas/theme'

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <MatrixBackground theme={DEFAULT_THEME} />

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="cyber-window p-8 text-center max-w-md">
          <h1 className="text-4xl text-cyber-orange mb-4">404</h1>
          <p className="text-cyber-muted mb-6">
            Deck not found. It may have been deleted or the URL is incorrect.
          </p>
          <Link href="/" className="cyber-button inline-block">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
