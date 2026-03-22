const variants = {
  pendiente: 'badge-pendiente',
  en_progreso: 'badge-en_progreso',
  completado: 'badge-completado',
  default: 'px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary',
}

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`${variants[variant] || variants.default} ${className}`}>
    {children}
  </span>
)

export default Badge
