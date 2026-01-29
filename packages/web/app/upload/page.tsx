'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MatrixBackground } from '@/components/matrix'
import { DEFAULT_THEME } from '@/schemas/theme'

const MAX_FILE_SIZE = 1 * 1024 * 1024    // 1MB per file
const MAX_TOTAL_SIZE = 5 * 1024 * 1024   // 5MB total

interface UploadedFile {
  name: string
  content: string
  size: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name} exceeds 1MB limit (${formatSize(file.size)})`)
          continue
        }
        const content = await file.text()
        newFiles.push({ name: file.name, content, size: file.size })
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    const newTotalSize = newFiles.reduce((sum, f) => sum + f.size, 0)

    setFiles((prev) => {
      const currentTotal = prev.reduce((sum, f) => sum + f.size, 0)
      if (currentTotal + newTotalSize > MAX_TOTAL_SIZE) {
        setError(`Adding these files would exceed 5MB total limit`)
        return prev
      }
      // Sort by filename
      const combined = [...prev, ...newFiles]
      combined.sort((a, b) => a.name.localeCompare(b.name))
      setError(null)
      return combined
    })
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const newIndex = direction === 'up' ? index - 1 : index + 1

      if (newIndex < 0 || newIndex >= newFiles.length) return prev

      const temp = newFiles[index]
      newFiles[index] = newFiles[newIndex]
      newFiles[newIndex] = temp

      return newFiles
    })
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please add at least one slide')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()

      for (const file of files) {
        formData.append('files', new Blob([file.content], { type: 'text/markdown' }), file.name)
      }

      if (title) formData.append('title', title)
      if (author) formData.append('author', author)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MatrixBackground theme={DEFAULT_THEME} />

      <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link href="/" className="text-cyber-green hover:text-cyber-cyan transition-colors">
            ← Back to Home
          </Link>
        </div>

        {/* Main content */}
        <div className="max-w-3xl mx-auto">
          <div className="cyber-window p-8">
            <h1 className="text-2xl text-cyber-green mb-6">Upload Deck</h1>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-cyber-muted text-sm mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Presentation"
                  className="w-full bg-transparent border border-cyber-green/30 px-4 py-2
                           focus:border-cyber-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-cyber-muted text-sm mb-2">
                  Author (optional)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent border border-cyber-green/30 px-4 py-2
                           focus:border-cyber-green focus:outline-none"
                />
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`upload-zone mb-6 ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-cyber-green text-xl mb-2">
                Drop markdown files here
              </div>
              <div className="text-cyber-muted">
                or click to select files
              </div>
              <div className="text-cyber-muted text-sm mt-2">
                Max 1MB per file, 5MB total
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mb-6">
                <h2 className="text-cyber-muted text-sm mb-2">
                  Slides ({files.length}) — {formatSize(totalSize)} / 5 MB
                </h2>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 px-4 py-2 bg-cyber-bg/50 border border-cyber-green/20"
                    >
                      <span className="text-cyber-muted w-6">{index + 1}.</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-cyber-muted text-sm">{formatSize(file.size)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveFile(index, 'up')}
                          disabled={index === 0}
                          className="text-cyber-muted hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveFile(index, 'down')}
                          disabled={index === files.length - 1}
                          className="text-cyber-muted hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-cyber-orange hover:text-cyber-pink"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 px-4 py-2 border border-cyber-orange/50 text-cyber-orange">
                {error}
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className="cyber-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${files.length} Slide${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-8 text-cyber-muted text-sm">
            <h3 className="text-cyber-green mb-2">Slide Format</h3>
            <pre className="bg-cyber-bg/50 p-4 border border-cyber-green/20 overflow-x-auto">
{`---
title: Slide Title
bigText: HELLO
gradient: fire
transition: glitch
---

Your slide content here with {GREEN}color tokens{/}

<!-- notes -->
Speaker notes go here
<!-- /notes -->`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
