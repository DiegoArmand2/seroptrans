import { forwardRef } from 'react'

const Input = forwardRef(
  ({ label, error, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2 border-primary/20
            bg-white text-dark placeholder-muted
            focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none
            transition-all duration-200 ease-smooth
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
