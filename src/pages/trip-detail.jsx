import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  Check,
  Crown,
  FileText,
  IndianRupee,
  Link2,
  Loader2,
  Plus,
  Printer,
  QrCode,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/auth-context'
import { computeNetBalancesFromExpenses } from '@/services/firestore/balances'
import { listTripExpenses } from '@/services/firestore/expenses'
import { inviteUserToTripByUsername } from '@/services/firestore/invites'
import { deleteTrip, getTrip, getTripMembers } from '@/services/firestore/trips'
import { minimizeTransactions } from '@/utils/settlement'
import { generateUpiLink } from '@/utils/upi'

const chartColors = [
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

import { UpiPaymentModal } from '@/components/ui/upi-modal'

export function TripDetailPage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [payeeModal, setPayeeModal] = useState({ open: false, upi: '', name: '', amount: 0, trip: '' })

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  // Copied link state
  const [copiedLink, setCopiedLink] = useState(false)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)

  // Delete trip state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isCreator = user && trip && user.uid === trip.creatorUid

  const handleDeleteTrip = async () => {
    setDeleting(true)
    try {
      await deleteTrip(tripId)
      navigate('/trips')
    } catch (err) {
      alert(err?.message || 'Failed to delete trip')
      setDeleting(false)
    }
  }

  const loadData = async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const tripData = await getTrip(tripId)
      setTrip(tripData)

      let memberList = []
      try {
        memberList = await getTripMembers(tripId)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[FareSplit] Error loading trip members:', e)
      }
      setMembers(memberList)

      let expenseList = []
      try {
        expenseList = await listTripExpenses(tripId)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[FareSplit] Error loading trip expenses:', e)
      }
      setExpenses(expenseList)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Failed to load trip detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  // 100% Dynamic Calculations from real expense records
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [expenses])

  const avgPerPerson = useMemo(() => {
    if (!members.length) return 0
    return Math.round((totalSpent / members.length) * 100) / 100
  }, [totalSpent, members.length])

  // Category breakdown chart data (100% dynamic)
  const categoryData = useMemo(() => {
    const cats = {}
    expenses.forEach((e) => {
      const cat = e.category || 'Other'
      cats[cat] = (cats[cat] || 0) + Number(e.amount || 0)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [expenses])

  // Most spent category name (100% dynamic)
  const mostSpentCategory = useMemo(() => {
    if (!categoryData.length) return 'None'
    const sorted = [...categoryData].sort((a, b) => b.value - a.value)
    return sorted[0]?.name || 'None'
  }, [categoryData])

  // Daily spending timeline (100% dynamic)
  const dailyData = useMemo(() => {
    const daysMap = {}
    expenses.forEach((e) => {
      let dayName = 'Recent'
      if (e.createdAt?.toDate) {
        dayName = e.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'short' })
      } else if (e.occurredAt?.toDate) {
        dayName = e.occurredAt.toDate().toLocaleDateString('en-US', { weekday: 'short' })
      }
      daysMap[dayName] = (daysMap[dayName] || 0) + Number(e.amount || 0)
    })
    return Object.entries(daysMap).map(([day, spent]) => ({ day, spent }))
  }, [expenses])

  // Member net balances (100% dynamic)
  const memberBalances = useMemo(() => {
    const net = computeNetBalancesFromExpenses(expenses)
    return members.map((m) => ({
      uid: m.uid,
      name: m.name || m.fullName || m.username || 'User',
      email: m.email || '',
      amount: net[m.uid] || 0,
      upiId: m.upiId || '',
    }))
  }, [expenses, members])

  // Settlements calculation (100% dynamic)
  const settlements = useMemo(() => {
    const balanceMap = {}
    memberBalances.forEach((m) => {
      balanceMap[m.name] = m.amount
    })
    const rawSettles = minimizeTransactions(balanceMap)
    return rawSettles.map((s) => {
      const toMember = memberBalances.find((m) => m.name === s.to)
      return {
        ...s,
        upi: toMember?.upiId || '',
      }
    })
  }, [memberBalances])

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      await inviteUserToTripByUsername({
        tripId,
        fromUid: user.uid,
        toUsername: inviteUsername.trim(),
      })
      triggerConfetti()
      setInviteSuccess(`Invitation sent to @${inviteUsername.trim()}!`)
      setInviteUsername('')
    } catch (err) {
      setInviteError(err?.message || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${tripId}`
    navigator.clipboard.writeText(joinUrl)
    triggerConfetti()
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  if (loading) {
    return (
      <div className="grid h-72 place-items-center rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold text-gray-600">Loading trip details...</span>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/70 p-12 text-center shadow-xl backdrop-blur-xl">
        <div className="text-xl font-bold text-gray-900">Trip Not Found</div>
        <div className="mt-2 text-sm text-gray-500">
          This trip may have been deleted or you don&apos;t have access to view it.
        </div>
        <Button asChild className="mt-6 rounded-2xl bg-indigo-600 px-6">
          <Link to="/trips">Back to Trips</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Top Bar Header */}
      <div className="flex flex-col gap-4 bg-white/80 p-5 sm:p-6 rounded-3xl border border-white/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              to="/trips"
              className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-gray-200/60 bg-white/90 transition hover:bg-white hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {trip.name}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
                {trip.description || 'Shared expense trip'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5 font-bold rounded-xl bg-indigo-50 px-3 py-1 text-indigo-700">
                  <Users className="h-3.5 w-3.5" /> {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold rounded-xl bg-emerald-50 px-3 py-1 text-emerald-700">
                  <IndianRupee className="h-3.5 w-3.5" /> Total ₹{totalSpent.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild className="h-11 rounded-2xl bg-indigo-600 px-5 font-bold hover:bg-indigo-700 shadow-md">
            <Link to={`/trips/${trip.id}/add-expense`} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4 shrink-0 text-white" />
              <span>Add Expense</span>
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                setInviteError('')
                setInviteSuccess('')
                setIsInviteModalOpen(true)
              }}
              variant="outline"
              className="h-10 flex-1 sm:flex-initial rounded-xl border-gray-200 bg-white/90 px-3.5 text-xs font-bold shadow-xs"
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" /> Invite
            </Button>
            <Button
              onClick={handleCopyJoinLink}
              variant="outline"
              className="h-10 flex-1 sm:flex-initial rounded-xl border-gray-200 bg-white/90 px-3.5 text-xs font-bold shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <QrCode className="mr-1.5 h-3.5 w-3.5 text-gray-600" /> Share Link
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsStatementModalOpen(true)}
              variant="outline"
              className="h-10 flex-1 sm:flex-initial rounded-xl border-indigo-200 bg-indigo-50/70 px-3.5 text-xs font-bold text-indigo-600 shadow-xs"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5 text-indigo-600" /> Statement
            </Button>

            {isCreator ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="h-10 flex-1 sm:flex-initial rounded-xl border-rose-200 bg-rose-50/80 px-3.5 text-xs font-bold text-rose-600 hover:bg-rose-100 shadow-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5 text-rose-600" /> Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Responsive Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full min-w-0 max-w-full">
        <div className="w-full overflow-x-auto pb-1 no-scrollbar flex items-center">
          <TabsList className="inline-flex h-11 min-w-full sm:min-w-0 rounded-2xl bg-white/90 p-1 shadow-sm backdrop-blur-xl border border-gray-100 items-center justify-start sm:justify-center">
            <TabsTrigger className="rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0" value="expenses">
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger className="rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0" value="balances">
              Balances
            </TabsTrigger>
            <TabsTrigger className="rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0" value="settlement">
              Settlement ({settlements.length})
            </TabsTrigger>
            <TabsTrigger className="rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0" value="members">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-5 w-full space-y-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full">
            <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Spending
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-900 sm:text-3xl">
                ₹{totalSpent.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Top Category
              </div>
              <div className="mt-2 text-2xl font-black text-purple-900 sm:text-3xl truncate">
                {mostSpentCategory}
              </div>
            </div>

            <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Avg Per Person
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-900 sm:text-3xl">
                ₹{avgPerPerson.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
            <Card className="w-full rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">Category breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="grid h-52 place-items-center text-xs font-medium text-gray-500">
                    No expenses logged yet for this trip.
                  </div>
                ) : (
                  <>
                    <div className="h-52 w-full flex items-center justify-center overflow-hidden py-2">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={4}
                          >
                            {categoryData.map((_, idx) => (
                              <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {categoryData.map((c, idx) => (
                        <span
                          key={c.name}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-xs"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ background: chartColors[idx % chartColors.length] }}
                          />
                          {c.name}: ₹{c.value.toLocaleString('en-IN')}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold">Daily spending</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length === 0 ? (
                  <div className="grid h-64 place-items-center text-sm font-medium text-gray-500">
                    No daily expense timeline yet.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData} margin={{ left: -15, right: 10 }}>
                        <defs>
                          <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                        <Area
                          type="monotone"
                          dataKey="spent"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fill="url(#indigoFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="mt-6">
          <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Expense History</CardTitle>
              <Button asChild size="sm" className="h-9 rounded-xl bg-indigo-600 font-bold px-3.5 text-white shadow-xs">
                <Link to={`/trips/${trip.id}/add-expense`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5 shrink-0 text-white" />
                  <span>Add Expense</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-gray-500">
                  No expenses added yet. Click &quot;Add Expense&quot; above to log expenses!
                </div>
              ) : (
                expenses.map((e) => {
                  const payer = members.find((m) => m.uid === e.paidByUid)
                  const payerName = payer ? payer.name : 'Someone'

                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-2xl p-4 transition hover:bg-white/80 border border-gray-100/60 shadow-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {e.description || 'Expense'}{' '}
                          <span className="text-indigo-600">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          Paid by {payerName}
                        </div>
                      </div>
                      <Badge className="rounded-xl px-3 py-1 font-semibold shrink-0" variant="secondary">
                        {e.category || 'Other'}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BALANCES TAB */}
        <TabsContent value="balances" className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberBalances.map((b) => (
              <div key={b.uid} className="w-full rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-gray-900 truncate">{b.name}</div>
                    <div className="text-xs font-medium text-gray-500 truncate">
                      {b.email || `@${b.name.toLowerCase()}`}
                    </div>
                  </div>
                  <div
                    className={[
                      'rounded-xl px-3 py-1.5 text-xs font-black shrink-0 whitespace-nowrap',
                      b.amount > 0
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : b.amount < 0
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200',
                    ].join(' ')}
                  >
                    {b.amount > 0
                      ? `+₹${b.amount.toLocaleString('en-IN')}`
                      : b.amount < 0
                      ? `-₹${Math.abs(b.amount).toLocaleString('en-IN')}`
                      : '₹0'}
                  </div>
                </div>
                <div className="mt-4 text-xs font-bold text-gray-500">
                  {b.amount > 0
                    ? 'Should receive'
                    : b.amount < 0
                    ? 'Should pay'
                    : 'Settled'}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SETTLEMENT TAB */}
        <TabsContent value="settlement" className="mt-6">
          <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Smart Settlements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-gray-500">
                  Everyone is fully settled up! No transactions needed. 🎉
                </div>
              ) : (
                settlements.map((s, idx) => {
                  const fromMember = memberBalances.find((m) => m.name === s.from)
                  const toMember = memberBalances.find((m) => m.name === s.to)
                  const isPayer = user && fromMember && user.uid === fromMember.uid
                  const isReceiver = user && toMember && user.uid === toMember.uid

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-100/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                    >
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {s.from} → {s.to}{' '}
                          <span className="text-indigo-600 font-extrabold">₹{s.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {s.upi ? `UPI ID: ${s.upi}` : 'UPI ID not set by recipient'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isPayer ? (
                          <Button
                            variant="outline"
                            className="h-10 w-full sm:w-auto rounded-xl border-indigo-200 font-bold text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              if (!s.upi) {
                                alert(`${s.to} has not set up their UPI ID in Settings yet.`)
                                return
                              }
                              triggerConfetti()
                              setPayeeModal({ open: true, upi: s.upi, name: s.to, amount: s.amount, trip: trip?.name || 'FareSplit' })
                            }}
                          >
                            Pay via UPI / QR
                          </Button>
                        ) : isReceiver ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 border border-amber-200 shadow-xs">
                            ⏳ Awaiting payment from {s.from}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="mt-6">
          <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Trip Members ({members.length})</CardTitle>
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                size="sm"
                className="rounded-xl bg-indigo-600 font-bold"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Invite Friend
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center justify-between rounded-2xl p-3.5 transition hover:bg-white/80 border border-gray-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                      {(m.name[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email || `@${m.username}`}</div>
                    </div>
                  </div>
                  {m.role === 'creator' ? (
                    <Badge className="gap-1.5 rounded-xl bg-amber-50 text-amber-700 border-amber-200 font-bold hover:bg-amber-50">
                      <Crown className="h-3 w-3" /> Creator
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-xl font-medium">
                      Member
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Modal */}
      {isInviteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Invite Friend to Trip
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Friend&apos;s Username or Email</label>
                <Input
                  className="mt-1.5 h-11 rounded-xl"
                  placeholder="e.g., rahul_07 or friend@gmail.com"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  required
                />
                <div className="mt-1.5 text-xs text-gray-500">
                  Enter their unique username or signed-up email address.
                </div>
              </div>

              {inviteSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  {inviteSuccess}
                </div>
              ) : null}

              {inviteError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {inviteError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-11 rounded-xl font-semibold"
                >
                  Done
                </Button>
                <Button
                  type="submit"
                  disabled={inviting}
                  className="h-11 rounded-xl bg-indigo-600 px-6 font-bold hover:bg-indigo-700"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Full Itemized Summary Statement Modal */}
      {isStatementModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" /> Trip Expense Summary Statement
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Itemized breakdown of all expenses for <span className="font-bold text-gray-800">{trip?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Trip Overview Stat Header */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-indigo-50/70 p-4 text-center">
              <div>
                <div className="text-xs font-semibold text-gray-500">Total Spent</div>
                <div className="text-lg font-black text-indigo-900">₹{totalSpent.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Total Expenses</div>
                <div className="text-lg font-black text-purple-900">{expenses.length}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Members</div>
                <div className="text-lg font-black text-emerald-900">{members.length}</div>
              </div>
            </div>

            {/* Itemized Expenses List */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2.5">Itemized Expenses List</h4>
              {expenses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-xs text-gray-500 font-medium">
                  No expenses logged for this trip yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3">Description</th>
                        <th className="px-3.5 py-3">Category</th>
                        <th className="px-3.5 py-3">Paid By</th>
                        <th className="px-3.5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {expenses.map((e) => {
                        const payer = members.find((m) => m.uid === e.paidByUid)
                        const payerName = payer ? payer.name : 'Someone'
                        return (
                          <tr key={e.id} className="hover:bg-gray-50/50">
                            <td className="px-3.5 py-3 font-semibold text-gray-900">
                              {e.description || 'Expense'}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                {e.category || 'Other'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3">{payerName}</td>
                            <td className="px-3.5 py-3 text-right font-black text-indigo-600">
                              ₹{Number(e.amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Final Settlement Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2.5">Final Settlement Dues</h4>
              {settlements.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
                  Everyone is fully settled up!
                </div>
              ) : (
                <div className="space-y-2">
                  {settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                    >
                      <span>
                        <span className="font-bold text-rose-600">{s.from}</span> pays{' '}
                        <span className="font-bold text-emerald-600">{s.to}</span>
                      </span>
                      <span className="font-black text-indigo-600 text-sm">
                        ₹{s.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-10 rounded-xl border-gray-200 text-xs font-bold text-gray-700"
              >
                <Printer className="mr-1.5 h-4 w-4" /> Print / Save PDF
              </Button>
              <Button
                onClick={() => setIsStatementModalOpen(false)}
                className="h-10 rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Close Statement
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Trip Confirmation Modal */}
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Trip?</h3>
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Are you sure you want to delete <span className="font-bold text-gray-800">{trip?.name}</span>? This will permanently delete all expenses and member records for this trip.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-11 flex-1 rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                disabled={deleting}
                onClick={handleDeleteTrip}
                className="h-11 flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700 text-white"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <UpiPaymentModal
        isOpen={payeeModal.open}
        onClose={() => setPayeeModal((prev) => ({ ...prev, open: false }))}
        upiId={payeeModal.upi}
        name={payeeModal.name}
        amount={payeeModal.amount}
        tripName={payeeModal.trip}
      />
    </div>
  )
}
