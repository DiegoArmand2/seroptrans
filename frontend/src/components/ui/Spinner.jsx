const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  return (
    <div
      className={`${sizeClasses[size]} border-2 border-primary/20 border-t-accent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}

export default Spinner
