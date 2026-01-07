"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
}

const CONFETTI_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ef4444", // red
  "#84cc16", // lime
]

interface ConfettiProps {
  isActive: boolean
  duration?: number
  pieceCount?: number
  onComplete?: () => void
}

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from(
        { length: pieceCount },
        (_, i) => ({
          id: i,
          x: Math.random() * 100, // % position
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: Math.random() * 500,
          duration: 2000 + Math.random() * 1000,
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
        })
      )
      setPieces(newPieces)

      // Clean up after animation
      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, pieceCount, duration, onComplete])

  if (!isMounted || pieces.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            borderRadius: "2px",
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}ms ease-out ${piece.delay}ms forwards`,
          }}
        />
      ))}
    </div>,
    document.body
  )
}

// Hook for triggering confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false)

  const trigger = useCallback(() => {
    setIsActive(true)
  }, [])

  const handleComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    isActive,
    trigger,
    Confetti: () => (
      <Confetti isActive={isActive} onComplete={handleComplete} />
    ),
  }
}

// Celebration component that combines confetti with a message
interface CelebrationProps {
  isVisible: boolean
  title: string
  subtitle?: string
  onDismiss: () => void
}

export function Celebration({
  isVisible,
  title,
  subtitle,
  onDismiss,
}: CelebrationProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <>
      <Confetti isActive={isVisible} />
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <div
          className={`
            bg-card rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl
            transform transition-all duration-500
            ${showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"}
          `}
          onClick={(e) => e.stopPropagation()}
          style={{ animation: showContent ? "bounce-in 0.5s ease-out" : undefined }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mb-6">{subtitle}</p>
          )}
          <button
            onClick={onDismiss}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  )
}
