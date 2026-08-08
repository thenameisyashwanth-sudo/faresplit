export function BentoGrid({ className = '', children }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[18rem] ${className}`}
    >
      {children}
    </div>
  )
}

export function BentoGridItem({
  className = '',
  title,
  description,
  header,
  icon,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`group/bento relative flex flex-col justify-between space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:shadow-2xl hover:border-indigo-300 hover:bg-white ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 text-lg font-black tracking-tight text-gray-900">
          {title}
        </div>
        <div className="mt-1 text-xs font-medium text-gray-500">
          {description}
        </div>
      </div>
    </div>
  )
}
