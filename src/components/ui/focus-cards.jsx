import { motion } from 'framer-motion'
import { useState } from 'react'

export function FocusCards({ items, renderCard, className = '' }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
          animate={{
            scale: hovered === index ? 1.02 : hovered !== null ? 0.97 : 1,
            filter: hovered !== null && hovered !== index ? 'blur(2px) grayscale(20%)' : 'blur(0px) grayscale(0%)',
            opacity: hovered !== null && hovered !== index ? 0.65 : 1,
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl"
        >
          {renderCard(item, hovered === index)}
        </motion.div>
      ))}
    </div>
  )
}
