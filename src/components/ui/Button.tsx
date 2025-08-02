import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variantClasses = {
      primary: 'bg-[#0D3F85] text-white hover:bg-[#0D3F85]/90 focus-visible:ring-[#0D3F85]',
      secondary: 'bg-white text-[#333333] border border-[#333333] hover:bg-[#333333] hover:text-white focus-visible:ring-[#333333]',
      danger: 'bg-[#C42024] text-white hover:bg-[#C42024]/90 focus-visible:ring-[#C42024]',
      ghost: 'text-[#333333] hover:bg-[#333333]/10 focus-visible:ring-[#333333]'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-md gap-2',
      lg: 'h-12 px-6 text-base rounded-lg gap-2'
    }
    
    const iconSizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    }

    return (
      <button
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className={clsx('animate-spin rounded-full border-2 border-current border-t-transparent', iconSizeClasses[size])} />
        ) : (
          Icon && iconPosition === 'left' && <Icon className={iconSizeClasses[size]} />
        )}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className={iconSizeClasses[size]} />}
      </button>
    )
  }
)

Button.displayName = 'Button'