"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, formatCurrency } from "@/lib/utils"

// Heading component with consistent styling
const headingVariants = cva("font-heading tracking-tight", {
  variants: {
    level: {
      h1: "text-3xl font-bold",
      h2: "text-2xl font-semibold",
      h3: "text-xl font-semibold",
      h4: "text-lg font-medium",
      h5: "text-base font-medium",
      h6: "text-sm font-medium",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      success: "text-success",
      danger: "text-danger",
    },
  },
  defaultVariants: {
    level: "h2",
    color: "default",
  },
})

interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function Heading({
  as,
  level = "h2",
  color,
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as || level || "h2"

  return React.createElement(
    Component,
    {
      className: cn(headingVariants({ level, color }), className),
      ...props,
    },
    children
  )
}

// Text component for body text with variants
const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      success: "text-success",
      danger: "text-danger",
      warning: "text-warning",
      income: "text-income",
      expense: "text-expense",
      investment: "text-investment",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    leading: {
      tight: "leading-tight",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    color: "default",
    align: "left",
    leading: "normal",
  },
})

interface TextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label"
  truncate?: boolean | 1 | 2 | 3
}

export function Text({
  as = "p",
  size,
  weight,
  color,
  align,
  leading,
  truncate,
  className,
  children,
  ...props
}: TextProps) {
  const Component = as

  const truncateClass =
    truncate === true
      ? "truncate"
      : truncate === 1
        ? "truncate-1"
        : truncate === 2
          ? "truncate-2"
          : truncate === 3
            ? "truncate-3"
            : ""

  return React.createElement(
    Component,
    {
      className: cn(textVariants({ size, weight, color, align, leading }), truncateClass, className),
      ...props,
    },
    children
  )
}

// Label component for form labels
interface LabelTextProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  optional?: boolean
}

export function LabelText({
  required,
  optional,
  className,
  children,
  ...props
}: LabelTextProps) {
  return (
    <label
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
      {optional && <span className="text-muted-foreground ml-1">(opcional)</span>}
    </label>
  )
}

// Caption component for small helper text
interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "error" | "success" | "warning"
}

export function Caption({
  variant = "default",
  className,
  children,
  ...props
}: CaptionProps) {
  return (
    <span
      className={cn(
        "text-xs",
        variant === "default" && "text-muted-foreground",
        variant === "error" && "text-danger",
        variant === "success" && "text-success",
        variant === "warning" && "text-warning",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Mono text for numbers and code
interface MonoTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
}

export function MonoText({
  size = "base",
  className,
  children,
  ...props
}: MonoTextProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  }

  return (
    <span
      className={cn("font-mono tabular-nums", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}

// Currency display component
interface CurrencyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
  showSign?: boolean
  colorize?: boolean
}

export function CurrencyText({
  value,
  size = "base",
  showSign = false,
  colorize = false,
  className,
  ...props
}: CurrencyTextProps) {
  const formatted = formatCurrency(Math.abs(value))

  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : ""

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  }

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        sizeClasses[size],
        colorize && value >= 0 && "text-income",
        colorize && value < 0 && "text-expense",
        className
      )}
      {...props}
    >
      {sign}
      {formatted}
    </span>
  )
}

// Percentage display component
interface PercentageTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  decimals?: number
  showSign?: boolean
  colorize?: boolean
}

export function PercentageText({
  value,
  decimals = 1,
  showSign = false,
  colorize = false,
  className,
  ...props
}: PercentageTextProps) {
  const formatted = `${Math.abs(value).toFixed(decimals)}%`
  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "tabular-nums",
        colorize && value >= 0 && "text-income",
        colorize && value < 0 && "text-expense",
        className
      )}
      {...props}
    >
      {sign}
      {formatted}
    </span>
  )
}

// Highlighted text
interface HighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "muted"
}

export function Highlight({
  variant = "primary",
  className,
  children,
  ...props
}: HighlightProps) {
  const variantClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    muted: "bg-muted text-muted-foreground",
  }

  return (
    <span
      className={cn("px-1.5 py-0.5 rounded text-sm font-medium", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
