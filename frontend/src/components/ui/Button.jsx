import { forwardRef } from 'react'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-button',
  accent: 'bg-accent text-white hover:bg-accent/90 shadow-button',
  outline: 'border-2 border-primary text-primary hover:bg-primary/5',
  ghost: 'text-primary hover:bg-primary/5',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-button',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 ease-smooth disabled:opacity-50 disabled:cursor-not-allowed'
    const variantClasses = variants[variant]
    const sizeClasses = sizes[size]

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : icon && iconPosition === 'left' ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
