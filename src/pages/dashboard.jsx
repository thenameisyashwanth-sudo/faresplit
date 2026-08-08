import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, IndianRupee, Loader2, PiggyBank, Sparkles, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AiAssistantDrawer } from '@/components/ai/ai-assistant-drawer'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UpiPaymentModal } from '@/components/ui/upi-modal'
import { useAuth } from '@/context/auth-context'
import { computeNetBalancesFromExpenses } from '@/services/firestore/balances'
import { listTripExpenses } from '@/services/firestore/expenses'
import { getTripMembers, listTripsForUser } from '@/services/firestore/trips'

const cardGradients = [
  'from-indigo-600 via-purple-600 to-indigo-800',
  'from-emerald-600 via-teal-600 to-emerald-800',
  'from-amber-500 via-orange-600 to-amber-700',
  'from-rose-600 via-pink-600 to-rose-800',
]

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payeeModal, setPayeeModal] = useState({ open: false, upi: '', name: '', amount: 0, trip: '' })

  const [stats, setStats] = useState({
    tripsJoined: 0,
    totalSpent: 0,
    youOwe: 0,
    owedToYou: 0,
  })

  const [pendingPayments, setPendingPayments] = useState([])
  const [owedToUserList, setOwedToUserList] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activeTrips, setActiveTrips] = useState([])

  useEffect(() => {
    if (!user) return

    const loadDashboard = async () => {
      setLoading(true)
      try {
        const userTrips = await listTripsForUser(user.uid)

        let totalUserSpent = 0
        let totalYouOweSum = 0
        let totalOwedToYouSum = 0

        const pendingList = []
        const owedList = []
        const allRecentExpenses = []
        const enrichedTrips = []

        for (let i = 0; i < userTrips.length; i++) {
          const trip = userTrips[i]
          const members = await getTripMembers(trip.id)
          const expenses = await listTripExpenses(trip.id)

          const netBalances = computeNetBalancesFromExpenses(expenses)
          const userNet = netBalances[user.uid] || 0

          const tripTotalSpent = expenses.reduce(
            (sum, e) => sum + Number(e.amount || 0),
            0
          )

          expenses.forEach((e) => {
            const amount = Number(e.amount || 0)
            const parts = Array.isArray(e.participantUids) ? e.participantUids : []
            if (parts.includes(user.uid)) {
              totalUserSpent += amount / (parts.length || 1)
            }

            const payer = members.find((m) => m.uid === e.paidByUid)
            allRecentExpenses.push({
              who: payer ? payer.name : 'Someone',
              what: e.description || 'Expense',
              amount: e.amount,
              category: e.category || 'Other',
              tripName: trip.name,
              createdAt: e.createdAt,
            })
          })

          if (userNet < 0) {
            totalYouOweSum += Math.abs(userNet)
            const creditors = members.filter((m) => (netBalances[m.uid] || 0) > 0)
            creditors.forEach((cred) => {
              pendingList.push({
                name: cred.name,
                amount: Math.abs(userNet),
                trip: trip.name,
                upi: cred.upiId || '',
              })
            })
          } else if (userNet > 0) {
            totalOwedToYouSum += userNet
            const debtors = members.filter((m) => (netBalances[m.uid] || 0) < 0)
            debtors.forEach((deb) => {
              owedList.push({
                name: deb.name,
                amount: Math.abs(netBalances[deb.uid] || 0),
                trip: trip.name,
              })
            })
          }

          enrichedTrips.push({
            id: trip.id,
            name: trip.name,
            members: members.length,
            total: tripTotalSpent,
            balance: userNet,
            gradient: cardGradients[i % cardGradients.length],
          })
        }

        setStats({
          tripsJoined: userTrips.length,
          totalSpent: Math.round(totalUserSpent),
          youOwe: Math.round(totalYouOweSum),
          owedToYou: Math.round(totalOwedToYouSum),
        })

        setPendingPayments(pendingList)
        setOwedToUserList(owedList)
        setRecentActivity(allRecentExpenses.slice(0, 6))
        setActiveTrips(enrichedTrips)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  const triggerPayConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    })
  }

  if (loading) {
    return (
      <div className="grid h-72 place-items-center rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold text-gray-600">Loading AI Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      {/* Laser Beams Animated Background Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl sm:p-8 border border-indigo-500/20"
      >
        <BackgroundBeams />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/40 backdrop-blur-md font-bold">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-300 animate-pulse" /> AI Financial Workspace
            </Badge>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              FareSplit AI Dashboard
            </h1>
            <p className="mt-1 text-xs text-indigo-200/80 sm:text-sm">
              Real-time Firestore sync, AI expense advisor & instant UPI settlements
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:from-indigo-600 hover:to-purple-700 shadow-lg border border-indigo-400/30"
          >
            <Link to="/trips">
              Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Spotlight Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSpotlight color="#6366f1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Trips Joined
              </div>
              <div className="mt-2 text-3xl font-black text-gray-900">
                {stats.tripsJoined}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </CardSpotlight>

        <CardSpotlight color="#10b981">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Spent
              </div>
              <div className="mt-2 text-3xl font-black text-gray-900">
                ₹{stats.totalSpent.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </CardSpotlight>

        <CardSpotlight color="#f43f5e">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                You Owe
              </div>
              <div className="mt-2 text-3xl font-black text-rose-600">
                ₹{stats.youOwe.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-600 text-white shadow-md">
              <PiggyBank className="h-6 w-6" />
            </div>
          </div>
        </CardSpotlight>

        <CardSpotlight color="#f59e0b">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Owed To You
              </div>
              <div className="mt-2 text-3xl font-black text-emerald-600">
                ₹{stats.owedToYou.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-md">
              <ArrowRight className="h-6 w-6" />
            </div>
          </div>
        </CardSpotlight>
      </div>

      {/* Pending & Owed Balance Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-white/80 bg-white/90 p-2 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-xs font-medium text-gray-500">
                You don&apos;t owe anyone money right now! 🎉
              </div>
            ) : (
              pendingPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                >
                  <div>
                    <div className="font-bold text-rose-900 text-sm">
                      You owe {p.name} ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-rose-700/70 font-medium">{p.trip}</div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!p.upi) {
                        alert(`${p.name} has not set up their UPI ID in Settings yet.`)
                        return
                      }
                      triggerPayConfetti()
                      setPayeeModal({ open: true, upi: p.upi, name: p.name, amount: p.amount, trip: p.trip })
                    }}
                    className="h-10 w-full rounded-xl bg-indigo-600 px-4 text-xs font-bold hover:bg-indigo-700 sm:w-auto shadow-md"
                  >
                    Pay Now via UPI / QR
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-white/80 bg-white/90 p-2 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900">Money Owed To You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {owedToUserList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-xs font-medium text-gray-500">
                No one owes you money right now.
              </div>
            ) : (
              owedToUserList.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-xs"
                >
                  <div>
                    <div className="font-bold text-emerald-900 text-sm">
                      {p.name} owes you ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-emerald-700/70 font-medium">{p.trip}</div>
                  </div>
                  <Badge className="rounded-xl bg-emerald-600 text-white font-bold px-3 py-1 text-xs">
                    Pending
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Trips & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="rounded-3xl border border-white/80 bg-white/90 p-2 backdrop-blur-xl shadow-xl lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900">Recent Expense Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-xs font-medium text-gray-500">
                No recent expense logs.
              </div>
            ) : (
              recentActivity.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl p-3.5 transition hover:bg-white border border-gray-100/60 shadow-xs text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate font-semibold text-gray-900">
                      {r.who} added <span className="text-indigo-600 font-bold">{r.what}</span>
                    </div>
                    <div className="truncate text-gray-500 font-medium mt-0.5">
                      {r.tripName} · {r.category}
                    </div>
                  </div>
                  <div className="font-black text-gray-900 shrink-0">
                    ₹{Number(r.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Trips Grid */}
        <Card className="rounded-3xl border border-white/80 bg-white/90 p-2 backdrop-blur-xl shadow-xl lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-gray-900">Active Trips</CardTitle>
            <Link className="text-xs font-bold text-indigo-600 hover:text-indigo-700" to="/trips">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center text-xs font-medium text-gray-500">
                You haven&apos;t created or joined any trips yet.{' '}
                <Link to="/trips" className="font-bold text-indigo-600 underline">
                  Create a Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeTrips.map((t) => (
                  <div
                    key={t.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition duration-300 hover:shadow-xl"
                  >
                    <div className={['h-24 bg-gradient-to-br p-4 text-white', t.gradient].join(' ')}>
                      <div className="text-base font-black truncate">{t.name}</div>
                      <div className="text-xs text-white/80 font-medium mt-0.5">
                        {t.members} member{t.members !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="p-4 bg-white">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Total spent</span>
                        <span className="font-black text-gray-900">₹{t.total.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Your balance</span>
                        <span
                          className={[
                            'font-bold',
                            t.balance < 0
                              ? 'text-rose-600'
                              : t.balance > 0
                              ? 'text-emerald-600'
                              : 'text-gray-600',
                          ].join(' ')}
                        >
                          {t.balance < 0
                            ? `You owe ₹${Math.abs(t.balance).toLocaleString('en-IN')}`
                            : t.balance > 0
                            ? `You receive ₹${t.balance.toLocaleString('en-IN')}`
                            : 'Settled'}
                        </span>
                      </div>

                      <Link
                        to={`/trips/${t.id}`}
                        className="mt-3 block w-full text-center rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                      >
                        Open Trip Workspace →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating AI Assistant Drawer */}
      <AiAssistantDrawer trips={activeTrips} totalSpent={stats.totalSpent} />

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
