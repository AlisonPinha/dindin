"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        "transition-all duration-400 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}

// Staggered children animation
interface StaggeredListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
}: StaggeredListProps) {
  return (
    <div
      className={cn("stagger-children", className)}
      style={{
        // CSS custom property for stagger delay
        "--stagger-delay": `${staggerDelay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

// Fade in on scroll (intersection observer)
interface FadeInOnScrollProps {
  children: React.ReactNode
  className?: string
  threshold?: number
}

export function FadeInOnScroll({
  children,
  className,
  threshold = 0.1,
}: FadeInOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(ref)
        }
      },
      { threshold }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold])

  return (
    <div
      ref={setRef}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
}

// Animated card wrapper
interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  clickEffect?: boolean
  delay?: number
}

export function AnimatedCard({
  children,
  className,
  hoverEffect = true,
  clickEffect = true,
  delay = 0,
}: AnimatedCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4",
        hoverEffect && "hover:-translate-y-1 hover:shadow-lg",
        clickEffect && "active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  )
}

// Shake animation hook for form errors
export function useShake() {
  const [isShaking, setIsShaking] = useState(false)

  const shake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  return {
    isShaking,
    shake,
    shakeClassName: isShaking ? "shake" : "",
  }
}

// Pulse animation for highlights
interface PulseHighlightProps {
  children: React.ReactNode
  isActive?: boolean
  className?: string
}

export function PulseHighlight({
  children,
  isActive = false,
  className,
}: PulseHighlightProps) {
  return (
    <div
      className={cn(
        "relative",
        isActive && "pulse-glow rounded-lg",
        className
      )}
    >
      {children}
    </div>
  )
}
