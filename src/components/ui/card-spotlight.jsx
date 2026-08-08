import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useState } from 'react'

export function CardSpotlight({
  children,
  radius = 350,
  color = '#6366f1',
  className = '',
  ...props
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`group/spotlight relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-indigo-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              ${color}25,
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
