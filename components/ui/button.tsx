import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap
   text-subhead font-semibold transition-all duration-150
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
   disabled:pointer-events-none disabled:opacity-50
   active:scale-[0.98]
   [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // Botão principal - azul Apple
        default: `
          bg-primary text-white
          hover:bg-primary-hover
          shadow-sm
        `,

        // Botão secundário - cinza sutil
        secondary: `
          bg-muted text-foreground
          hover:bg-secondary/80
        `,

        // Botão destrutivo - vermelho
        destructive: `
          bg-danger text-white
          hover:bg-danger/90
        `,

        // Botão outline
        outline: `
          border border-card-border bg-transparent
          hover:bg-muted
        `,

        // Botão ghost - só texto
        ghost: `
          hover:bg-muted
        `,

        // Botão link
        link: `
          text-primary underline-offset-4
          hover:underline
        `,

        // Botão de sucesso - verde
        success: `
          bg-success text-white
          hover:bg-success/90
        `,
      },
      size: {
        sm: "h-8 px-3 text-caption rounded-md",
        default: "h-10 px-5 rounded-lg",
        lg: "h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    isLoading,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
