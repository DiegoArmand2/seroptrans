const PageHeader = ({ title, description, children }) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  </div>
)

export default PageHeader
