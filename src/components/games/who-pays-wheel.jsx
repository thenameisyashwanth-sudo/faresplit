import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Dices, Sparkles, Trophy, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

const sliceColors = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#84cc16',
]

export function WhoPaysWheelModal({ isOpen, onClose, members = [] }) {
  const canvasRef = useRef(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [rotation, setRotation] = useState(0)

  const activeMembers =
    members.length > 0
      ? members
      : [
          { name: 'Yashwanth', email: 'yash@example.com' },
          { name: 'Alex', email: 'alex@example.com' },
          { name: 'Priya', email: 'priya@example.com' },
          { name: 'Rahul', email: 'rahul@example.com' },
        ]

  useEffect(() => {
    if (!isOpen) return
    drawWheel(rotation)
  }, [isOpen, rotation, members])

  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = width / 2 - 10

    ctx.clearRect(0, 0, width, height)

    const numSlices = activeMembers.length
    const sliceAngle = (2 * Math.PI) / numSlices

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle + currentAngle
      const endAngle = (i + 1) * sliceAngle + currentAngle

      // Slice background
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = sliceColors[i % sliceColors.length]
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      // Slice Text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px sans-serif'
      const displayName = activeMembers[i].name || activeMembers[i].email?.split('@')[0] || `User ${i+1}`
      ctx.fillText(displayName, radius - 20, 5)
      ctx.restore()
    }

    // Center Hub
    ctx.beginPath()
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI)
    ctx.fillStyle = '#1e1b4b'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Center Icon / Dot
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = '#818cf8'
    ctx.fill()
  }

  const handleSpin = () => {
    if (isSpinning) return
    setIsSpinning(true)
    setWinner(null)

    const extraRounds = 5 + Math.floor(Math.random() * 5)
    const randomOffset = Math.random() * Math.PI * 2
    const totalRotation = rotation + extraRounds * Math.PI * 2 + randomOffset

    const startTime = performance.now()
    const duration = 4000 // 4 seconds spin animation

    const animateSpin = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentAngle = rotation + (totalRotation - rotation) * easeOut

      setRotation(currentAngle)
      drawWheel(currentAngle)

      if (progress < 1) {
        requestAnimationFrame(animateSpin)
      } else {
        setIsSpinning(false)
        setRotation(currentAngle)

        // Calculate Winner
        const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI)
        const sliceAngle = (2 * Math.PI) / activeMembers.length
        // Pointer is at top (3*PI/2)
        const pointerAngle = (3 * Math.PI / 2 + normalizedAngle) % (2 * Math.PI)
        const winningIdx = Math.floor(pointerAngle / sliceAngle) % activeMembers.length

        const winningMember = activeMembers[winningIdx]
        const winnerName = winningMember.name || winningMember.email?.split('@')[0] || 'Selected Member'
        setWinner(winnerName)

        // Trigger Confetti Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }

    requestAnimationFrame(animateSpin)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl text-center"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30">
              <Dices className="h-6 w-6 animate-bounce" />
            </div>
            <h2 className="mt-3 text-xl font-black text-gray-900">Who Pays Next? 🎡</h2>
            <p className="text-xs font-bold text-indigo-600">Gamified Bill Picker for Group Outings</p>
          </div>

          {/* Wheel Display Container */}
          <div className="relative my-6 flex justify-center items-center">
            {/* Top Pointer Indicator */}
            <div className="absolute -top-3 z-20 h-0 w-0 border-x-8 border-x-transparent border-t-[16px] border-t-rose-600 drop-shadow-md" />

            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="rounded-full shadow-2xl border-4 border-white"
            />
          </div>

          {/* Winner Announcement Card */}
          {winner && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-3.5 text-white shadow-xl"
            >
              <div className="flex items-center justify-center gap-2 font-black text-sm">
                <Trophy className="h-5 w-5 text-yellow-200" />
                <span>Winner Picked: {winner}!</span>
              </div>
              <p className="text-[11px] font-semibold text-amber-100 mt-0.5">
                {winner} gets to pay this bill upfront. FareSplit will handle the settlement calculation!
              </p>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-base font-black text-white shadow-xl hover:opacity-95 transition hover:scale-[1.02] active:scale-95"
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" /> Spinning Wheel...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Spin Wheel Now!
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
