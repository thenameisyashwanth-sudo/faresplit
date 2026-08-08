import { motion } from 'framer-motion'
import { IndianRupee, Loader2, Map, PieChart as PieIcon, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { listTripExpenses } from '@/services/firestore/expenses'
import { getTripMembers, listTripsForUser } from '@/services/firestore/trips'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

function Stat3DCard({ label, value, icon: Icon, iconBg, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="w-full">
      <CardContainer containerClassName="py-0 w-full">
        <CardBody className="w-full rounded-2xl border border-white/60 bg-white/70 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition hover:border-indigo-200 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <CardItem translateZ="20" className="text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-sm">
                {label}
              </CardItem>
              <CardItem translateZ="40" className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
                {value}
              </CardItem>
            </div>
            <CardItem translateZ="50">
              <div
                className={[
                  'grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14',
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

export function ReportsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [tripsHistory, setTripsHistory] = useState([])
  const [totalSpentSum, setTotalSpentSum] = useState(0)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    if (!user) return

    const loadReports = async () => {
      setLoading(true)
      try {
        const userTrips = await listTripsForUser(user.uid)
        
        let totalPersonalSpent = 0
        const catMap = {}
        const monthMap = {}
        const historyList = []

        for (const t of userTrips) {
          const members = await getTripMembers(t.id)
          const expenses = await listTripExpenses(t.id)

          const tripTotalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

          expenses.forEach((e) => {
            const amount = Number(e.amount || 0)
            const parts = Array.isArray(e.participantUids) ? e.participantUids : []
            if (parts.includes(user.uid)) {
              const personalShare = amount / (parts.length || 1)
              totalPersonalSpent += personalShare

              const cat = e.category || 'Other'
              catMap[cat] = (catMap[cat] || 0) + personalShare

              let month = 'Recent'
              if (e.createdAt?.toDate) {
                month = e.createdAt.toDate().toLocaleDateString('en-US', { month: 'short' })
              }
              monthMap[month] = (monthMap[month] || 0) + personalShare
            }
          })

          historyList.push({
            id: t.id,
            name: t.name,
            members: members.length,
            status: t.status || 'Active',
            total: tripTotalSpent,
          })
        }

        setTotalSpentSum(Math.round(totalPersonalSpent))
        setTripsHistory(historyList)

        const formattedCats = Object.entries(catMap).map(([name, value]) => ({
          name,
          value: Math.round(value),
        }))
        setCategoryData(formattedCats)

        const formattedMonths = Object.entries(monthMap).map(([month, spent]) => ({
          month,
          spent: Math.round(spent),
        }))
        setMonthlyData(formattedMonths)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [user])

  const tripsJoined = tripsHistory.length
  const avgPerTrip = useMemo(() => {
    if (!tripsJoined) return 0
    return Math.round(totalSpentSum / tripsJoined)
  }, [totalSpentSum, tripsJoined])

  const topCategoryName = useMemo(() => {
    if (!categoryData.length) return 'None'
    const sorted = [...categoryData].sort((a, b) => b.value - a.value)
    return sorted[0]?.name || 'None'
  }, [categoryData])

  if (loading) {
    return (
      <div className="grid h-72 place-items-center rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold text-gray-600">Generating your Reports...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 3D Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat3DCard
          label="Trips Joined"
          value={tripsJoined.toString()}
          icon={Wallet}
          iconBg="bg-gradient-to-br from-indigo-500 to-purple-600"
          delay={0}
        />
        <Stat3DCard
          label="Total Spent"
          value={`₹${totalSpentSum.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay={0.05}
        />
        <Stat3DCard
          label="Avg per Trip"
          value={`₹${avgPerTrip.toLocaleString('en-IN')}`}
          icon={Map}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0.1}
        />
        <Stat3DCard
          label="Top Category"
          value={topCategoryName}
          icon={PieIcon}
          iconBg="bg-gradient-to-br from-violet-500 to-fuchsia-600"
          delay={0.15}
        />
      </div>

      {/* Monthly & Category Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="grid h-64 place-items-center text-sm font-medium text-gray-500">
                No monthly spending data yet.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="indigoArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="url(#indigoArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="grid h-64 place-items-center text-sm font-medium text-gray-500">
                No category expense data yet.
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
                        innerRadius={50}
                        outerRadius={80}
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
      </div>

      {/* Trip History List */}
      <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Trip History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tripsHistory.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-gray-500">
              No trip history recorded yet.
            </div>
          ) : (
            tripsHistory.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-2xl p-4 transition hover:bg-white/80 border border-gray-100/60 sm:flex-row sm:items-center sm:justify-between shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{t.members} member{t.members !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge
                    className={[
                      'rounded-xl px-3 py-1 font-bold',
                      t.status === 'Active'
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {t.status}
                  </Badge>
                  <div className="text-sm font-black text-gray-900">
                    ₹{t.total.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
