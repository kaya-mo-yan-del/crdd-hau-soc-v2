const STATUS_CONFIG = {
  checking: { dotClass: 'bg-muted animate-pulse', text: 'Checking device status…' },
  online: { dotClass: 'bg-success', text: 'Raspberry Pi is online' },
  offline: { dotClass: 'bg-critical', text: 'Raspberry Pi is offline' },
}

export default function Header({ title = 'Detection result', subtitle = '(Daily)', deviceStatus = 'checking' }) {
  const { dotClass, text } = STATUS_CONFIG[deviceStatus] ?? STATUS_CONFIG.checking

  return (
    <div className="mb-6">
      <h1 className="font-display font-semibold text-lg tracking-tight">
        {title}{' '}
        {subtitle ? <span className="text-muted font-normal text-base">{subtitle}</span> : null}
      </h1>
      <p className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
        <span className={`w-2 h-2 rounded-full inline-block ${dotClass}`} />
        {text}
      </p>
    </div>
  )
}
