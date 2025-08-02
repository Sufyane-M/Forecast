import React from 'react'
import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'rounded-lg bg-white'
    
    const variantClasses = {
      default: 'border border-[#333333]/10',
      outlined: 'border-2 border-[#333333]/20',
      elevated: 'shadow-lg border border-[#333333]/5'
    }
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('space-y-1.5', className)}
        {...props}
      >
        {title && (
          <h3 className="text-lg font-semibold text-[#333333]">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-[#333333]/60">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('pt-6', className)}
        {...props}
      />
    )
  }
)

CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-center pt-6', className)}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'