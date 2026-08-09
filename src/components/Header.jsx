export default function Header({ title = 'Detection result', subtitle = '(Daily)' }) {
  return (
    <header className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-shrink-0">
      <h1 className="text-xl text-gray-700 font-medium flex items-center gap-2">
        {title}
        {subtitle ? <span className="text-gray-400 font-normal">{subtitle}</span> : null}
      </h1>
    </header>
  )
}
