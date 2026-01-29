'use client'

import dynamic from 'next/dynamic'
import { DEMO_DECK } from '@/lib/demo-deck'

const SlideViewer = dynamic(
  () => import('@/components/slides/SlideViewer').then(mod => mod.SlideViewer),
  { ssr: false }
)

export default function DemoPage() {
  return <SlideViewer deck={DEMO_DECK} />
}
