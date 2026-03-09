import {
  ArrowLeft,
  Crown,
  IndianRupee,
  Link2,
  Plus,
  QrCode,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateUpiLink } from '@/utils/upi'
import { minimizeTransactions } from '@/utils/settlement'

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

export function TripDetailPage() {
  const { tripId } = useParams()

  const trip = {
    id: tripId,
    name: 'Pondicherry Trip',
    description: 'Beach vibes, cafés, and sunsets.',
    members: 4,
    total: 4300,
  }

  const categoryData = [
    { name: 'Food', value: 1850 },
    { name: 'Transport', value: 1200 },
    { name: 'Hotel', value: 1100 },
    { name: 'Other', value: 150 },
  ]

  const daily = [
    { day: 'Mon', spent: 900 },
    { day: 'Tue', spent: 1400 },
    { day: 'Wed', spent: 800 },
    { day: 'Thu', spent: 1200 },
  ]

  const expenses = [
    { time: '10:30 AM', title: 'Auto', amount: 400, by: 'Yashwanth' },
    { time: '12:15 PM', title: 'Lunch', amount: 850, by: 'Rahul' },
    { time: '3:00 PM', title: 'Bus', amount: 300, by: 'Yashwanth' },
  ]

  const balances = [
    { name: 'Yashwanth', amount: 284, email: 'yashwanth@example.com' },
    { name: 'Rahul', amount: -142, email: 'rahul@example.com' },
    { name: 'Arun', amount: -142, email: 'arun@example.com' },
    { name: 'Karthik', amount: 0, email: 'karthik@example.com' },
  ]

  const upiByName = {
    Yashwanth: 'yashwanth@oksbi',
  }

  const settlements = minimizeTransactions(
    Object.fromEntries(balances.map((b) => [b.name, b.amount]))
  ).map((t) => ({
    ...t,
    upi: upiByName[t.to] || '',
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/trips"
            className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl transition hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-2xl font-bold tracking-tight">{trip.name}</div>
            <div className="text-sm text-gray-500">{trip.description}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" /> {trip.members} members
              </span>
              <span className="inline-flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Total ₹{trip.total}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-11 rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700">
            <Link to={`/trips/${trip.id}/add-expense`}>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Link>
          </Button>
          <Button variant="outline" className="h-11 rounded-xl px-5">
            <Link2 className="mr-2 h-4 w-4" /> Invite
          </Button>
          <Button variant="outline" className="h-11 rounded-xl px-5">
            <QrCode className="mr-2 h-4 w-4" /> Share QR
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="rounded-xl bg-gray-100/80 p-1">
          <TabsTrigger className="rounded-lg" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger className="rounded-lg" value="expenses">
            Expenses
          </TabsTrigger>
          <TabsTrigger className="rounded-lg" value="balances">
            Balances
          </TabsTrigger>
          <TabsTrigger className="rounded-lg" value="settlement">
            Settlement
          </TabsTrigger>
          <TabsTrigger className="rounded-lg" value="members">
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm text-gray-500">Total spending</div>
                <div className="mt-1 text-2xl font-bold">₹{trip.total}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm text-gray-500">Most spent category</div>
                <div className="mt-1 text-2xl font-bold">Food</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm text-gray-500">Avg per person</div>
                <div className="mt-1 text-2xl font-bold">₹614</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Category breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryData.map((c, idx) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-1 text-xs text-gray-600"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: chartColors[idx % chartColors.length] }}
                      />
                      {c.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Daily spending</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#indigoFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Expense timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.map((e) => (
                <div
                  key={e.time + e.title}
                  className="flex items-center justify-between rounded-xl p-3 transition hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {e.time} – {e.title} ₹{e.amount}
                    </div>
                    <div className="text-xs text-gray-500">{e.by}</div>
                  </div>
                  <Badge className="rounded-xl" variant="secondary">
                    Expense
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => (
              <Card key={b.name} className="rounded-2xl border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-500">{b.email}</div>
                    </div>
                    <div
                      className={[
                        'rounded-xl px-3 py-1 text-sm font-semibold',
                        b.amount > 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : b.amount < 0
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-gray-50 text-gray-600',
                      ].join(' ')}
                    >
                      {b.amount > 0
                        ? `+₹${b.amount}`
                        : b.amount < 0
                          ? `-₹${Math.abs(b.amount)}`
                          : '₹0'}
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    {b.amount > 0
                      ? 'Should receive'
                      : b.amount < 0
                        ? 'Should pay'
                        : 'Settled'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settlement" className="mt-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Smart settlements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settlements.map((s) => (
                <div
                  key={s.from + s.to}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {s.from} → {s.to}{' '}
                      <span className="text-indigo-600">₹{s.amount}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Minimum-transaction suggestion
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => {
                        window.location.href = generateUpiLink({
                          pa: s.upi,
                          pn: s.to,
                          am: s.amount,
                          tn: `${trip.name} settlement`,
                        })
                      }}
                      disabled={!s.upi}
                    >
                      Pay UPI
                    </Button>
                    <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                      Mark Paid
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {balances.map((m) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between rounded-xl p-3 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white">
                      {m.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </div>
                  </div>
                  {m.name === 'Yashwanth' ? (
                    <Badge className="gap-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-50">
                      <Crown className="h-3 w-3" /> Creator
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-xl">
                      Member
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

