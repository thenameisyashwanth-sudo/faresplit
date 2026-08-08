import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { ArrowRight, IndianRupee, Loader2, PiggyBank, Sparkles, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { computeNetBalancesFromExpenses } from '@/services/firestore/balances'
import { listTripExpenses } from '@/services/firestore/expenses'
import { getTripMembers, listTripsForUser } from '@/services/firestore/trips'
import { generateUpiLink } from '@/utils/upi'

function Stat3DCard({ label, value, icon: Icon, iconBg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="w-full"
    >
      <CardContainer className="w-full" containerClassName="w-full py-0">
        <CardBody className="relative group/card w-full rounded-2xl border border-white/60 bg-white/70 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:border-indigo-200 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <CardItem translateZ="20" className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-sm">
                {label}
              </CardItem>
              <CardItem translateZ="40" className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {value}
              </CardItem>
            </div>
            <CardItem translateZ="50">
              <div
                className={[
                  'grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14 transition duration-300 group-hover/card:scale-110',
                  iconBg,
                ].join(' ')}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </motion.div>
  )
}

const cardGradients = [
  'from-indigo-600 via-purple-600 to-indigo-800',
  'from-emerald-600 via-teal-600 to-emerald-800',
  'from-amber-500 via-orange-600 to-amber-700',
  'from-rose-600 via-pink-600 to-rose-800',
]

import { UpiPaymentModal } from '@/components/ui/upi-modal'

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

          // Calculate user's personal share across expenses in this trip
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
          <span className="text-sm font-semibold text-gray-600">Loading your 3D Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 text-white shadow-2xl sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 bg-indigo-500/30 text-indigo-200 border-indigo-400/30 backdrop-blur-md">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-300" /> AI Powered 3D Workspace
            </Badge>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Shared Expense Dashboard
            </h1>
            <p className="mt-1 text-sm text-indigo-200/90 sm:text-base">
              Real-time Firestore sync & instant UPI settlements for your trips
            </p>
          </div>
          <Button
            asChild
            className="h-12 rounded-2xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 shadow-lg"
          >
            <Link to="/trips">
              Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* 3D Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat3DCard
          label="Trips Joined"
          value={stats.tripsJoined.toString()}
          icon={Wallet}
          iconBg="bg-gradient-to-br from-indigo-500 to-purple-600"
          delay={0}
        />
        <Stat3DCard
          label="Total Spent"
          value={`₹${stats.totalSpent.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay={0.05}
        />
        <Stat3DCard
          label="You Owe"
          value={`₹${stats.youOwe.toLocaleString('en-IN')}`}
          icon={PiggyBank}
          iconBg="bg-gradient-to-br from-rose-500 to-pink-600"
          delay={0.1}
        />
        <Stat3DCard
          label="Owed To You"
          value={`₹${stats.owedToYou.toLocaleString('en-IN')}`}
          icon={ArrowRight}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0.15}
        />
      </div>

      {/* Pending & Owed Balance Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-sm font-medium text-gray-500">
                You don&apos;t owe anyone money right now! 🎉
              </div>
            ) : (
              pendingPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                >
                  <div>
                    <div className="font-bold text-rose-800">
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

        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Money Owed To You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {owedToUserList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-sm font-medium text-gray-500">
                No one owes you money right now.
              </div>
            ) : (
              owedToUserList.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm"
                >
                  <div>
                    <div className="font-bold text-emerald-800">
                      {p.name} owes you ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-emerald-700/70 font-medium">{p.trip}</div>
                  </div>
                  <Badge className="rounded-xl bg-emerald-600 text-white font-bold px-3 py-1">
                    Pending
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & 3D Active Trips */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 backdrop-blur-xl shadow-xl lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-sm font-medium text-gray-500">
                No recent activity.
              </div>
            ) : (
              recentActivity.map((r, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between rounded-2xl p-3.5 transition hover:bg-white/80 border border-gray-50/50 shadow-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {r.who} added <span className="text-indigo-600">{r.what}</span>
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {r.tripName} · {r.category}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                    ₹{Number(r.amount).toLocaleString('en-IN')}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 3D Active Trips Section */}
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 backdrop-blur-xl shadow-xl lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Active Trips</CardTitle>
            <Link className="text-sm font-bold text-indigo-600 hover:text-indigo-700" to="/trips">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center text-sm font-medium text-gray-500">
                You haven&apos;t created or joined any trips yet.{' '}
                <Link to="/trips" className="font-bold text-indigo-600 underline">
                  Create a Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeTrips.map((t) => (
                  <CardContainer key={t.id} containerClassName="py-0 w-full">
                    <CardBody className="group/card relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition duration-300 hover:shadow-2xl">
                      <div className={['h-28 bg-gradient-to-br p-4 text-white', t.gradient].join(' ')}>
                        <CardItem translateZ="30" className="text-lg font-bold text-white truncate">
                          {t.name}
                        </CardItem>
                        <CardItem translateZ="20" className="text-xs text-white/80 mt-1 font-medium">
                          {t.members} member{t.members !== 1 ? 's' : ''}
                        </CardItem>
                      </div>

                      <div className="p-4 bg-white/90">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 font-medium">Total spent</span>
                          <span className="font-bold text-gray-900">₹{t.total.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
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

                        <CardItem translateZ="40" className="mt-3 w-full">
                          <Link
                            to={`/trips/${t.id}`}
                            className="block w-full text-center rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                          >
                            Open Trip →
                          </Link>
                        </CardItem>
                      </div>
                    </CardBody>
                  </CardContainer>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
