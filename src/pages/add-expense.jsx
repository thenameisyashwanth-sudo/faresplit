import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/auth-context'
import { ReceiptScannerModal } from '@/components/ai/receipt-scanner-modal'
import { addExpense } from '@/services/firestore/expenses'
import { getTripMembers } from '@/services/firestore/trips'

const categories = [
  'Food',
  'Transport',
  'Hotel',
  'Shopping',
  'Entertainment',
  'Tickets',
  'Fuel',
  'Drinks',
  'Groceries',
  'Medical',
  'Other',
]

export function AddExpensePage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Food')
  const [paidBy, setPaidBy] = useState('')
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Speech recognition state
  const [listening, setListening] = useState(false)

  // AI Receipt Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const handleScanComplete = (extracted) => {
    if (extracted.amount) setAmount(String(extracted.amount))
    if (extracted.title) setDescription(extracted.title)
    if (extracted.category) {
      const match = categories.find(
        (c) => c.toLowerCase() === extracted.category.toLowerCase()
      )
      setCategory(match || 'Food')
    }
  }

  useEffect(() => {
    if (!tripId) return
    const loadMembers = async () => {
      setLoadingMembers(true)
      try {
        const list = await getTripMembers(tripId)
        setMembers(list)
        if (user && list.some((m) => m.uid === user.uid)) {
          setPaidBy(user.uid)
        } else if (list.length > 0) {
          setPaidBy(list[0].uid)
        }
        setSelected(list.map((m) => m.uid))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Failed to load trip members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadMembers()
  }, [tripId, user])

  const perPerson = useMemo(() => {
    const a = Number(amount || 0)
    if (!selected.length) return 0
    return Math.round((a / selected.length) * 100) / 100
  }, [amount, selected.length])

  // Speech recognition effect
  useEffect(() => {
    if (!listening) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.')
      setListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')

      if (!text) return
      setDescription(text)

      // 1. Smart Amount Extraction (e.g. "spent 2400 rupees", "400 for lunch")
      const numMatch = text.match(/(\d+)/)
      if (numMatch) {
        setAmount(numMatch[1])
      }

      // 2. Smart Category Matching
      const lower = text.toLowerCase()
      if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('food') || lower.includes('breakfast') || lower.includes('cafe') || lower.includes('coffee')) {
        setCategory('Food')
      } else if (lower.includes('taxi') || lower.includes('cab') || lower.includes('uber') || lower.includes('flight') || lower.includes('travel')) {
        setCategory('Transport')
      } else if (lower.includes('hotel') || lower.includes('stay') || lower.includes('resort') || lower.includes('airbnb')) {
        setCategory('Hotel')
      } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('gas')) {
        setCategory('Fuel')
      } else if (lower.includes('drink') || lower.includes('beer') || lower.includes('wine')) {
        setCategory('Drinks')
      } else if (lower.includes('shopping') || lower.includes('mall') || lower.includes('buy')) {
        setCategory('Shopping')
      }

      // 3. Smart Payer Detection (e.g. "Rahul paid 2000")
      if (members.length > 0) {
        const foundMember = members.find((m) => {
          const name = (m.name || m.email || '').toLowerCase()
          return name && lower.includes(name.split(' ')[0])
        })
        if (foundMember) {
          setPaidBy(foundMember.uid)
        }
      }
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.start()
    return () => recognition.stop()
  }, [listening])

  const toggleMember = (id, checked) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev
        return [...prev, id]
      }
      return prev.filter((item) => item !== id)
    })
  }

  const selectAll = () => setSelected(members.map((m) => m.uid))
  const selectNone = () => setSelected([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!description.trim()) {
      setError('Please enter an expense description')
      return
    }
    if (!selected.length) {
      setError('Please select at least one participant')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await addExpense({
        tripId,
        amount: Number(amount),
        description: description.trim(),
        category,
        paidByUid: paidBy,
        participantUids: selected,
        billUrl: '',
        occurredAt: dateTime ? new Date(dateTime) : new Date(),
      })

      navigate(`/trips/${tripId}`)
    } catch (err) {
      setError(err?.message || 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingMembers) {
    return (
      <div className="grid h-64 place-items-center rounded-3xl border border-gray-100 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/trips/${tripId}`}
          className="grid h-10 w-10 place-items-center rounded-xl transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="text-2xl font-bold tracking-tight">Add Expense</div>
          <div className="text-sm text-gray-500">Record a new shared expense</div>
        </div>
      </div>

      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Expense Details</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 text-xs font-bold text-white shadow-md hover:opacity-90 transition"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Scan Receipt with AI
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setListening(!listening)}
                className={[
                  'h-9 rounded-xl text-xs font-medium transition',
                  listening ? 'border-rose-300 bg-rose-50 text-rose-600' : 'text-gray-600',
                ].join(' ')}
              >
                {listening ? (
                  <>
                    <MicOff className="mr-1.5 h-3.5 w-3.5 text-rose-600 animate-pulse" /> Listening...
                  </>
                ) : (
                  <>
                    <Mic className="mr-1.5 h-3.5 w-3.5" /> Voice Input
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReceiptScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanComplete={handleScanComplete}
          />
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
              <Input
                type="number"
                className="mt-1.5 h-12 rounded-xl text-lg font-bold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                className="mt-1.5 h-11 rounded-xl"
                placeholder="What was this expense for? (e.g. Lunch, Taxi, Hotel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Paid By</label>
                <select
                  value={paidBy || (members[0]?.uid ?? '')}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.name} {m.uid === user?.uid ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Date & Time</label>
              <Input
                type="datetime-local"
                className="mt-1.5 h-11 rounded-xl"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>

            {/* Split Members Checklist */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200/60">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    Split Equally ({selected.length} members)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-xs text-gray-400">·</span>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="text-xs font-semibold text-gray-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {members.map((m) => {
                  const isChecked = selected.includes(m.uid)
                  return (
                    <label
                      key={m.uid}
                      className={[
                        'flex items-center justify-between rounded-xl p-3 border transition cursor-pointer',
                        isChecked
                          ? 'border-indigo-200 bg-white shadow-sm'
                          : 'border-transparent hover:bg-white/50',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(c) => toggleMember(m.uid, Boolean(c))}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {m.name} {m.uid === user?.uid ? '(You)' : ''}
                        </span>
                      </div>
                      {isChecked && perPerson > 0 ? (
                        <span className="text-xs font-semibold text-indigo-600">
                          ₹{perPerson}
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200/60 text-sm">
                <span className="text-gray-500">Per Person Share:</span>
                <span className="font-bold text-indigo-600 text-base">
                  ₹{perPerson.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/trips/${tripId}`)}
                className="h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Save Expense
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
