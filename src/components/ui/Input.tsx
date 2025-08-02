import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    helperText,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseClasses = 'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-[#333333] placeholder:text-[#333333]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    
    const stateClasses = error
      ? 'border-[#C42024] focus-visible:ring-[#C42024]'
      : 'border-[#333333]/20 focus-visible:ring-[#0D3F85]'
    
    const iconClasses = 'h-4 w-4 text-[#333333]/60'

    return (
      <div className={clsx('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-[#333333]"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon className={iconClasses} />
            </div>
          )}
          
          <input
            id={inputId}
            className={clsx(
              baseClasses,
              stateClasses,
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Icon className={iconClasses} />
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            'text-xs',
            error ? 'text-[#C42024]' : 'text-[#333333]/60'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'