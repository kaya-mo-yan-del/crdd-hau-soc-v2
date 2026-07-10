export default function Header({ title = 'Detection result', subtitle = '(Daily)' }) {
  return (
    <div className="mb-6">
      <h1 className="font-display font-semibold text-lg tracking-tight">
        {title}{' '}
        {subtitle ? <span className="text-muted font-normal text-base">{subtitle}</span> : null}
      </h1>
      <p className="text-xs text-muted mt-1.5">
        Live audio monitoring is active.
      </p>
    </div>
  )
}
