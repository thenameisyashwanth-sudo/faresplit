import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AiAssistantDrawer({ trips = [], totalSpent = 0 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your FareSplit AI Advisor ✨ How can I help you analyze expenses, check settlements, or budget your trips today?',
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const quickPrompts = [
    'Who owes money across trips?',
    'What is my top spending category?',
    'Give budget tips for next trip',
    'How does debt minimization work?',
  ]

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query) return

    const userMsg = { id: Date.now(), sender: 'user', text: query }
    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setTyping(true)

    setTimeout(() => {
      let reply = ''
      const lower = query.toLowerCase()

      if (lower.includes('who owes') || lower.includes('owes me') || lower.includes('settlement')) {
        reply = `Based on your active trips (${trips.length} active), FareSplit uses the Greedy Minimum Debt Algorithm to automatically calculate net balances. Check the "Settlement" tab in any trip to see exact UPI direct payment buttons!`
      } else if (lower.includes('category') || lower.includes('highest') || lower.includes('spending')) {
        reply = `Your current total logged spending across all trips is ₹${totalSpent.toLocaleString(
          'en-IN'
        )}. Top categories usually include Food, Travel, and Stay. Visit the "Reports" tab for full interactive visual charts!`
      } else if (lower.includes('budget') || lower.includes('tips') || lower.includes('save')) {
        reply = `💡 AI Budget Tip: Setting equal expense split rules before the trip begins reduces end-of-trip settlement friction by 40%. You can also use voice input when logging expenses on mobile!`
      } else if (lower.includes('minimiz') || lower.includes('algorithm')) {
        reply = `FareSplit's Smart Settlement Engine minimizes transaction count from N*(N-1) down to at most N-1 direct payments, saving everyone time and bank transfer steps!`
      } else {
        reply = `I analyzed your ${trips.length} trip workspace! Total spent is ₹${totalSpent.toLocaleString(
          'en-IN'
        )}. You can ask me about balances, smart settlements, or category breakdowns anytime.`
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply }])
      setTyping(false)
    }, 900)
  }

  return (
    <>
      {/* Floating Glowing AI Bot Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3 text-white shadow-2xl transition hover:scale-105 hover:shadow-indigo-500/50"
      >
        <div className="relative">
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <span className="text-xs font-black tracking-wide uppercase sm:inline">AI Advisor</span>
      </button>

      {/* Drawer Dialog */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 right-4 z-50 w-[92vw] max-w-sm rounded-3xl border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl sm:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">FareSplit AI Advisor</h3>
                  <p className="text-[11px] font-semibold text-indigo-600">Smart Financial Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="mt-3 h-72 overflow-y-auto space-y-3 p-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50/80 text-gray-800 border border-indigo-100'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-3 py-2 text-xs text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    AI is thinking...
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Prompts */}
            <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="mt-3 flex items-center gap-2"
            >
              <Input
                className="h-10 rounded-xl text-xs"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI anything about your trips..."
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
