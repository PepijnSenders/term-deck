'use client'

import type { Slide } from '@/schemas/slide'

interface SlideListProps {
  slides: Slide[]
  currentIndex: number
  onSelect: (index: number) => void
  onClose: () => void
}

export function SlideList({ slides, currentIndex, onSelect, onClose }: SlideListProps) {
  return (
    <div className="slide-list-modal" onClick={onClose}>
      <div
        className="slide-list-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cyber-green text-lg">Slides</h2>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-white"
          >
            [ESC]
          </button>
        </div>

        <div className="space-y-1">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slide-list-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                onSelect(index)
                onClose()
              }}
            >
              <span className="text-cyber-muted w-8">{index + 1}.</span>
              <span className="truncate">{slide.frontmatter.title}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-cyber-green/20 text-sm text-cyber-muted">
          Press number keys (1-9) to jump directly
        </div>
      </div>
    </div>
  )
}
