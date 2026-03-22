const Card = ({ children, className = '', hover = true, ...props }) => (
  <div
    className={`card ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-heading font-semibold text-primary ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-muted ${className}`}>{children}</p>
)

const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-primary/10 flex items-center gap-2 ${className}`}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
