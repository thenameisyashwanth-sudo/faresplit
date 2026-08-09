import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Edit2,
  Flame,
  IndianRupee,
  PieChart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function BudgetTrackerCard({ totalSpent = 0, memberCount = 1, initialBudget = 25000 }) {
  const [budget, setBudget] = useState(initialBudget)
  const [isEditing, setIsEditing] = useState(false)
  const [tempBudget, setTempBudget] = useState(initialBudget)

  const percent = Math.min(Math.round((totalSpent / budget) * 100), 150)
  const remaining = budget - totalSpent

  // Calculate daily burn & projections (assuming 4-day trip average)
  const assumedDays = 4
  const dailyBurn = Math.round(totalSpent / assumedDays)
  const projectedTotal = dailyBurn * assumedDays
  const perPersonCap = Math.max(Math.round(remaining / (assumedDays * (memberCount || 1))), 0)

  let statusConfig = {
    label: 'On Track & Healthy',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    barColor: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    icon: ShieldCheck,
  }

  if (percent >= 100) {
    statusConfig = {
      label: 'Over Budget Warning!',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      icon: AlertTriangle,
    }
  } else if (percent >= 80) {
    statusConfig = {
      label: 'Approaching Limit',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
      icon: Flame,
    }
  }

  const handleSaveBudget = (e) => {
    e.preventDefault()
    const val = Number(tempBudget)
    if (val > 0) {
      setBudget(val)
      setIsEditing(false)
    }
  }

  const StatusIcon = statusConfig.icon

  return (
    <Card className="overflow-hidden border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 shadow-xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-indigo-100/50">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-gray-900">
              Trip Budget & Burn Rate Predictor
            </CardTitle>
            <p className="text-[11px] font-semibold text-indigo-600">Smart Financial Forecast</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${statusConfig.color}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{statusConfig.label}</span>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition"
            title="Edit Budget Target"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Budget Target Edit Modal / Banner */}
        {isEditing && (
          <form
            onSubmit={handleSaveBudget}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 p-3 text-white shadow-lg"
          >
            <Input
              type="number"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              placeholder="Set target trip budget..."
              className="h-9 bg-white text-gray-900 text-xs font-bold rounded-xl"
            />
            <Button type="submit" size="sm" className="h-9 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl shrink-0">
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-9 text-white hover:bg-white/20 font-bold rounded-xl shrink-0"
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Progress Bar & Main Stats */}
        <div>
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="font-bold text-gray-600">
              Spent: <strong className="text-gray-900 text-sm">₹{totalSpent.toLocaleString('en-IN')}</strong>
            </span>
            <span className="font-bold text-gray-500">
              Target: <strong className="text-indigo-600 text-sm">₹{budget.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-indigo-100/70 p-0.5 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${statusConfig.barColor}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-1">
            <span>{percent}% Budget Utilized</span>
            <span className={remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {remaining >= 0
                ? `₹${remaining.toLocaleString('en-IN')} Remaining`
                : `₹${Math.abs(remaining).toLocaleString('en-IN')} Over Limit`}
            </span>
          </div>
        </div>

        {/* Insights & Daily Burn Matrix */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" /> Daily Burn Rate
            </div>
            <p className="mt-1 text-lg font-black text-gray-900">
              ₹{dailyBurn.toLocaleString('en-IN')}<span className="text-xs font-medium text-gray-400">/day</span>
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <ArrowUpRight className="h-3.5 w-3.5 text-purple-600" /> Projected Final
            </div>
            <p className="mt-1 text-lg font-black text-gray-900">
              ₹{projectedTotal.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* AI Nudge Box */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-3 border border-indigo-200/50">
          <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500 animate-bounce" /> Smart Budget Nudge:
          </p>
          <p className="mt-1 text-[11px] font-medium text-gray-700 leading-relaxed">
            {remaining > 0
              ? `To stay strictly under your ₹${budget.toLocaleString(
                  'en-IN'
                )} target, we recommend capping spending at ₹${perPersonCap.toLocaleString(
                  'en-IN'
                )} per member / day for the rest of the trip.`
              : `You have exceeded the target budget by ₹${Math.abs(remaining).toLocaleString(
                  'en-IN'
                )}. Consider using FareSplit's Greedy Debt Settlement to settle pending balances now.`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
