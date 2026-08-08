import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  Check,
  Crown,
  IndianRupee,
  Link2,
  Loader2,
  Plus,
  QrCode,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { getTrip, getTripMembers } from '@/services/firestore/trips'
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
    <div className="space-y-8">
      {/* Top Bar Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/trips"
            className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-gray-200/60 bg-white/80 transition hover:bg-white hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <div>
            <div className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              {trip.name}
            </div>
            <div className="text-sm font-medium text-gray-500">
              {trip.description || 'Shared expense trip'}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5 font-bold rounded-xl bg-indigo-50 px-3 py-1 text-indigo-700">
                <Users className="h-4 w-4" /> {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold rounded-xl bg-emerald-50 px-3 py-1 text-emerald-700">
                <IndianRupee className="h-4 w-4" /> Total ₹{totalSpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-11 rounded-2xl bg-indigo-600 px-5 font-bold hover:bg-indigo-700 shadow-md">
            <Link to={`/trips/${trip.id}/add-expense`}>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Link>
          </Button>
          <Button
            onClick={() => {
              setInviteError('')
              setInviteSuccess('')
              setIsInviteModalOpen(true)
            }}
            variant="outline"
            className="h-11 rounded-2xl border-white/80 bg-white/70 px-4 font-bold shadow-sm backdrop-blur-md"
          >
            <Link2 className="mr-2 h-4 w-4" /> Invite
          </Button>
          <Button
            onClick={handleCopyJoinLink}
            variant="outline"
            className="h-11 rounded-2xl border-white/80 bg-white/70 px-4 font-bold shadow-sm backdrop-blur-md"
          >
            {copiedLink ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" /> Share Link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Responsive Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-12 min-w-full rounded-2xl bg-white/80 p-1.5 shadow-sm backdrop-blur-xl sm:min-w-0">
            <TabsTrigger className="rounded-xl text-xs sm:text-sm font-bold" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="rounded-xl text-xs sm:text-sm font-bold" value="expenses">
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger className="rounded-xl text-xs sm:text-sm font-bold" value="balances">
              Balances
            </TabsTrigger>
            <TabsTrigger className="rounded-xl text-xs sm:text-sm font-bold" value="settlement">
              Settlement ({settlements.length})
            </TabsTrigger>
            <TabsTrigger className="rounded-xl text-xs sm:text-sm font-bold" value="members">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* 3D Overview Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CardContainer containerClassName="py-0 w-full">
              <CardBody className="w-full rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
                <CardItem translateZ="20" className="text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-sm">
                  Total Spending
                </CardItem>
                <CardItem translateZ="40" className="mt-2 text-2xl font-black text-indigo-900 sm:text-3xl">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </CardItem>
              </CardBody>
            </CardContainer>

            <CardContainer containerClassName="py-0 w-full">
              <CardBody className="w-full rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
                <CardItem translateZ="20" className="text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-sm">
                  Top Category
                </CardItem>
                <CardItem translateZ="40" className="mt-2 text-2xl font-black text-purple-900 sm:text-3xl">
                  {mostSpentCategory}
                </CardItem>
              </CardBody>
            </CardContainer>

            <CardContainer containerClassName="py-0 w-full">
              <CardBody className="w-full rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
                <CardItem translateZ="20" className="text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-sm">
                  Avg Per Person
                </CardItem>
                <CardItem translateZ="40" className="mt-2 text-2xl font-black text-emerald-900 sm:text-3xl">
                  ₹{avgPerPerson.toLocaleString('en-IN')}
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold">Category breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="grid h-60 place-items-center text-sm font-medium text-gray-500">
                    No expenses logged yet for this trip.
                  </div>
                ) : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      {categoryData.map((c, idx) => (
                        <span
                          key={c.name}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
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
              <Button asChild size="sm" className="rounded-xl bg-indigo-600 font-bold">
                <Link to={`/trips/${trip.id}/add-expense`}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Expense
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
        <TabsContent value="balances" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberBalances.map((b) => (
              <CardContainer key={b.uid} containerClassName="py-0 w-full">
                <CardBody className="w-full rounded-3xl border border-white/60 bg-white/70 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardItem translateZ="20" className="text-base font-bold text-gray-900">
                        {b.name}
                      </CardItem>
                      <CardItem translateZ="10" className="text-xs font-medium text-gray-500">
                        {b.email || `@${b.name.toLowerCase()}`}
                      </CardItem>
                    </div>
                    <CardItem
                      translateZ="30"
                      className={[
                        'rounded-xl px-3 py-1 text-sm font-bold',
                        b.amount > 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : b.amount < 0
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-gray-50 text-gray-600',
                      ].join(' ')}
                    >
                      {b.amount > 0
                        ? `+₹${b.amount.toLocaleString('en-IN')}`
                        : b.amount < 0
                        ? `-₹${Math.abs(b.amount).toLocaleString('en-IN')}`
                        : '₹0'}
                    </CardItem>
                  </div>
                  <div className="mt-4 text-xs font-bold text-gray-500">
                    {b.amount > 0
                      ? 'Should receive'
                      : b.amount < 0
                      ? 'Should pay'
                      : 'Settled'}
                  </div>
                </CardBody>
              </CardContainer>
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
                settlements.map((s, idx) => (
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
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  </div>
                ))
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
