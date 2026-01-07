"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedCardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-md hover:shadow-lg",
        flat: "border-transparent bg-muted/50",
        outline: "bg-transparent",
        glass: "bg-card/80 backdrop-blur-md border-white/10",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer",
        scale: "hover:scale-[1.02] cursor-pointer",
        border: "hover:border-primary cursor-pointer",
      },
      gradient: {
        none: "",
        primary: "bg-gradient-to-br from-primary/5 to-transparent",
        success: "bg-gradient-to-br from-success/8 to-transparent",
        danger: "bg-gradient-to-br from-danger/8 to-transparent",
        investment: "bg-gradient-to-br from-investment/8 to-transparent",
        subtle: "bg-gradient-to-br from-muted/50 to-transparent",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      gradient: "none",
      padding: "default",
    },
  }
)

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  asChild?: boolean
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant, hover, gradient, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(enhancedCardVariants({ variant, hover, gradient, padding }), className)}
      {...props}
    />
  )
)
EnhancedCard.displayName = "EnhancedCard"

// Card Header with gradient option
interface EnhancedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: "primary" | "success" | "danger" | "investment" | "none"
}

const EnhancedCardHeader = React.forwardRef<HTMLDivElement, EnhancedCardHeaderProps>(
  ({ className, gradient = "none", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-4 rounded-t-xl -m-4 mb-0",
        gradient === "primary" && "gradient-header",
        gradient === "success" && "gradient-header-success",
        gradient === "danger" && "gradient-header-danger",
        gradient === "investment" && "gradient-header-investment",
        className
      )}
      {...props}
    />
  )
)
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t mt-4 -mx-4 px-4 -mb-4 pb-4 rounded-b-xl", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

// Stat Card - specialized for displaying statistics
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: React.ReactNode
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
  }
  variant?: "income" | "expense" | "investment" | "neutral"
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, description, icon, trend, variant = "neutral", ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "income":
          return {
            gradient: "success" as const,
            iconBg: "bg-success/10",
            iconColor: "text-success",
            trendColor: trend && trend.value >= 0 ? "text-success" : "text-danger",
          }
        case "expense":
          return {
            gradient: "danger" as const,
            iconBg: "bg-danger/10",
            iconColor: "text-danger",
            trendColor: trend && trend.value <= 0 ? "text-success" : "text-danger",
          }
        case "investment":
          return {
            gradient: "investment" as const,
            iconBg: "bg-investment/10",
            iconColor: "text-investment",
            trendColor: trend && trend.value >= 0 ? "text-success" : "text-danger",
          }
        default:
          return {
            gradient: "subtle" as const,
            iconBg: "bg-muted",
            iconColor: "text-muted-foreground",
            trendColor: trend && trend.value >= 0 ? "text-success" : "text-danger",
          }
      }
    }

    const styles = getVariantStyles()

    return (
      <EnhancedCard
        ref={ref}
        variant="elevated"
        hover="lift"
        gradient={styles.gradient}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", styles.trendColor)}>
                <span>
                  {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground font-normal">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("rounded-lg p-2.5", styles.iconBg, styles.iconColor)}>
              {icon}
            </div>
          )}
        </div>
      </EnhancedCard>
    )
  }
)
StatCard.displayName = "StatCard"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
  StatCard,
  enhancedCardVariants,
}
