import { motion } from 'framer-motion'
import { IndianRupee, Map, PieChart as PieIcon, Wallet } from 'lucide-react'
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

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

function StatCard({ label, value, icon: Icon, iconBg }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl border-gray-100 shadow-sm transition hover:shadow-md">
        <CardContent className="flex items-start justify-between p-6">
          <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
          </div>
          <div
            className={[
              'grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg',
              iconBg,
            ].join(' ')}
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ReportsPage() {
  const monthly = [
    { month: 'Jan', spent: 2600 },
    { month: 'Feb', spent: 4300 },
    { month: 'Mar', spent: 5400 },
    { month: 'Apr', spent: 3200 },
    { month: 'May', spent: 6100 },
  ]

  const categories = [
    { name: 'Food', value: 5200 },
    { name: 'Transport', value: 2800 },
    { name: 'Hotel', value: 3400 },
    { name: 'Other', value: 900 },
  ]

  const history = [
    { id: 'pondy', name: 'Pondicherry Trip', members: 4, status: 'Active', total: 4300 },
    { id: 'goa', name: 'Goa Weekend', members: 3, status: 'Completed', total: 7800 },
    { id: 'blr', name: 'Bangalore Food Crawl', members: 5, status: 'Completed', total: 5600 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Trips Joined"
          value="3"
          icon={Wallet}
          iconBg="bg-gradient-to-br from-indigo-500 to-purple-600"
        />
        <StatCard
          label="Total Spent"
          value="₹17,700"
          icon={IndianRupee}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Avg per Trip"
          value="₹5,900"
          icon={Map}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          label="Top Category"
          value="Food"
          icon={PieIcon}
          iconBg="bg-gradient-to-br from-violet-500 to-fuchsia-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="indigoArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#indigoArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categories.map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c, idx) => (
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
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Trip history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-xl p-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.members} members</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Badge
                  className={[
                    'rounded-xl',
                    t.status === 'Active'
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {t.status}
                </Badge>
                <div className="text-sm font-bold">₹{t.total}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

