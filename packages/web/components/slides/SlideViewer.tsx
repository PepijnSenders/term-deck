'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DeckBundle } from '@/schemas/deck-bundle'
import { MatrixBackground } from '@/components/matrix'
import { SlideWindow } from './SlideWindow'
import { SlideList } from './SlideList'
import { ProgressBar } from './ProgressBar'

interface SlideViewerProps {
  deck: DeckBundle
}

export function SlideViewer({ deck }: SlideViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSlideList, setShowSlideList] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [slideKey, setSlideKey] = useState(0)

  const { slides, config } = deck
  const theme = config.theme

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index)
      setSlideKey((k) => k + 1)
    }
  }, [slides.length])

  const nextSlide = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1)
    }
  }, [currentIndex, slides.length, goToSlide])

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1)
    }
  }, [currentIndex, goToSlide])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if modal is open
      if (showSlideList && e.key !== 'Escape' && e.key !== 'l' && e.key !== 'L') {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'n':
        case 'j':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
        case 'Backspace':
        case 'p':
        case 'k':
          e.preventDefault()
          prevSlide()
          break
        case 'Home':
          e.preventDefault()
          goToSlide(0)
          break
        case 'End':
          e.preventDefault()
          goToSlide(slides.length - 1)
          break
        case 'l':
        case 'L':
          e.preventDefault()
          setShowSlideList((s) => !s)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (showSlideList) {
            setShowSlideList(false)
          }
          break
        default:
          // Number keys 1-9 for direct slide access
          if (e.key >= '1' && e.key <= '9') {
            const slideNum = parseInt(e.key, 10) - 1
            if (slideNum < slides.length) {
              e.preventDefault()
              goToSlide(slideNum)
            }
          }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, goToSlide, toggleFullscreen, showSlideList, slides.length])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Get all slides up to and including current (for stacking effect)
  const visibleSlides = slides.slice(0, currentIndex + 1)

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Matrix rain background */}
      <MatrixBackground theme={theme} />

      {/* Slide content - stack all visible slides */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="relative">
          {visibleSlides.map((slide, idx) => (
            <SlideWindow
              key={`slide-${idx}`}
              slide={slide}
              theme={theme}
              isActive={idx === currentIndex}
              windowIndex={idx}
            />
          ))}
        </div>
      </div>

      {/* Slide counter */}
      <div className="fixed top-4 right-4 z-40 text-cyber-muted text-sm">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Controls hint */}
      <div className="fixed bottom-4 right-4 z-40 text-cyber-muted text-xs">
        <span className="opacity-50">
          ← → navigate | L list | F fullscreen
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar current={currentIndex} total={slides.length} />

      {/* Slide list modal */}
      {showSlideList && (
        <SlideList
          slides={slides}
          currentIndex={currentIndex}
          onSelect={goToSlide}
          onClose={() => setShowSlideList(false)}
        />
      )}
    </div>
  )
}
