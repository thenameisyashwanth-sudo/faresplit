import { motion } from 'framer-motion'

export function BackgroundBeams({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] ${className}`}
    >
      <svg
        className="absolute h-full w-full stroke-indigo-500/20 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 40V.5H40" fill="none" strokeDasharray="2 2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)" />
      </svg>

      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/0 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, 80, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/30 via-indigo-500/20 to-purple-500/0 blur-3xl"
      />
    </div>
  )
}
