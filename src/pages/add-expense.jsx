import {
  ArrowLeft,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  const fileRef = useRef(null)

  const members = [
    { id: 'yash', name: 'Yashwanth' },
    { id: 'rahul', name: 'Rahul' },
    { id: 'arun', name: 'Arun' },
    { id: 'karthik', name: 'Karthik' },
  ]

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Food')
  const [paidBy, setPaidBy] = useState('yash')
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [selected, setSelected] = useState(() => members.map((m) => m.id))

  const perPerson = useMemo(() => {
    const a = Number(amount || 0)
    if (!selected.length) return 0
    return Math.round((a / selected.length) * 100) / 100
  }, [amount, selected.length])

  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    if (!listening) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
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
      setTranscript(text)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.start()
    return () => recognition.stop()
  }, [listening])

  const toggleMember = (id, checked) => {
    setSelected((prev) => {
      const has = prev.includes(id)
      if (checked === true && !has) return [...prev, id]
      if (checked === false && has) return prev.filter((x) => x !== id)
      return prev
    })
  }

  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === members.length ? [] : members.map((m) => m.id)
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          to={`/trips/${tripId}`}
          className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="text-2xl font-bold tracking-tight">Add Expense</div>
          <div className="text-sm text-gray-500">Trip: {tripId}</div>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Expense details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <Camera className="h-5 w-5 text-indigo-600" />
              <span className="font-medium">Scan Bill</span>
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <input ref={fileRef} className="hidden" type="file" accept="image/*" />
            </button>

            <button
              onClick={() => setListening((v) => !v)}
              className={[
                'group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 transition',
                listening
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50',
              ].join(' ')}
            >
              {listening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5 text-indigo-600" />
              )}
              <span className="font-medium">Voice</span>
            </button>
          </div>

          {transcript ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Heard:</span>{' '}
              {transcript}
            </div>
          ) : null}

          <div>
            <div className="text-sm font-medium text-gray-700">Amount</div>
            <Input
              className="mt-2 h-14 text-2xl font-bold"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">Description</div>
            <Input
              className="mt-2 h-11"
              placeholder="e.g., Lunch at cafe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-700">Category</div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2 h-11 w-full rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700">Paid By</div>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="mt-2 h-11 w-full rounded-xl">
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">Date & time</div>
            <Input
              className="mt-2 h-11 rounded-xl"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                Split Between
              </div>
              <button
                onClick={toggleAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {selected.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2">
              {members.map((m) => {
                const isChecked = selected.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition',
                      isChecked
                        ? 'border-indigo-200 bg-indigo-50/50'
                        : 'border-gray-100 bg-white hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) => toggleMember(m.id, v === true)}
                    />
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 text-sm font-medium">{m.name}</div>
                    <Users className="h-4 w-4 text-gray-400" />
                  </label>
                )
              })}
            </div>

            <div className="text-sm text-gray-500">
              ₹{Number.isFinite(perPerson) ? perPerson : 0} per person
            </div>
          </div>

          <Button className="h-12 w-full rounded-xl bg-indigo-600 text-base hover:bg-indigo-700">
            Save Expense
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

