import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `flex h-11 w-full rounded-lg border bg-background px-4 py-2
           text-base text-foreground
           placeholder:text-secondary
           transition-all duration-150
           file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground

           /* Focus state */
           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary

           /* Disabled */
           disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted

           /* Hover */
           hover:border-foreground-secondary`,

          error
            ? "border-danger focus:ring-danger/30 focus:border-danger"
            : "border-card-border",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
