import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, GitCommit, Network, Zap } from 'lucide-react'
import { useState } from 'react'

const avatarColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
]

export function DebtGraphVisualizer({ members = [], settlements = [], expenses = [] }) {
  const [viewMode, setViewMode] = useState('optimized') // 'optimized' | 'raw'
  const [selectedNode, setSelectedNode] = useState(null)

  // Map member UIDs / IDs to readable names
  const memberMap = {}
  members.forEach((m, idx) => {
    const id = m.uid || m.id || `user_${idx}`
    const name = m.name || m.email?.split('@')[0] || `User ${idx + 1}`
    memberMap[id] = { id, name, color: avatarColors[idx % avatarColors.length] }
  })

  // Derive raw un-optimized transactions from expense splits
  const rawTransactions = []
  expenses.forEach((e) => {
    const paidBy = e.paidByUid || e.paidBy
    const payerName = memberMap[paidBy]?.name || 'Member'
    const participants = e.participantUids || members.map((m) => m.uid)
    if (!participants.length) return
    const splitAmount = Math.round((Number(e.amount || 0) / participants.length) * 100) / 100

    participants.forEach((pId) => {
      if (pId !== paidBy && splitAmount > 0) {
        const borrowerName = memberMap[pId]?.name || 'Member'
        rawTransactions.push({
          from: borrowerName,
          to: payerName,
          amount: splitAmount,
        })
      }
    })
  })

  const activeTransactions = viewMode === 'optimized' ? settlements : rawTransactions

  return (
    <div className="rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-2xl overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Header Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 backdrop-blur-md">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Smart Settlement Flow <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            </h3>
            <p className="text-xs text-indigo-300 font-medium">
              Visualizing optimized direct group payments for your trip
            </p>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('raw')}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              viewMode === 'raw'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Individual Debts ({rawTransactions.length})
          </button>
          <button
            onClick={() => setViewMode('optimized')}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              viewMode === 'optimized'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Simplified Payments ({settlements.length})
          </button>
        </div>
      </div>

      {/* Graph Visual Display Canvas */}
      <div className="relative z-10 mt-6 min-h-[200px] flex flex-col justify-center">
        {activeTransactions.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 animate-bounce" />
            <p className="text-sm font-bold text-gray-300">All debts are fully settled!</p>
            <p className="text-xs text-gray-500">No payment transfers needed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTransactions.map((tx, idx) => {
              const isSelected = selectedNode === idx
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedNode(isSelected ? null : idx)}
                  className={`group relative overflow-hidden rounded-2xl border p-3.5 transition cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-600/30 shadow-lg shadow-indigo-500/20'
                      : 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Payer Node */}
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/30 uppercase">
                        {tx.from?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{tx.from}</p>
                        <p className="text-[10px] text-rose-400 font-semibold">Payer</p>
                      </div>
                    </div>

                    {/* Animated Arrow Connector */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-[11px] font-extrabold text-amber-400">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                      <div className="flex items-center gap-1 text-indigo-400">
                        <span className="h-0.5 w-6 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full" />
                        <ArrowRight className="h-4 w-4 animate-pulse" />
                      </div>
                    </div>

                    {/* Receiver Node */}
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-xs font-bold text-white">{tx.to}</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">Receiver</p>
                      </div>
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 uppercase">
                        {tx.to?.charAt(0) || 'R'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Simplification Summary Bar */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-semibold text-gray-400 gap-2">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-indigo-400" />
          <span>
            Individual Debts:{' '}
            <strong className="text-rose-400">{rawTransactions.length} payments</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Zap className="h-3.5 w-3.5 fill-emerald-400" />
          <span>
            Smart Settlement reduced payment transfers by{' '}
            {rawTransactions.length > 0
              ? Math.round(
                  ((rawTransactions.length - settlements.length) / rawTransactions.length) * 100
                )
              : 100}
            %
          </span>
        </div>
      </div>
    </div>
  )
}
