import { motion } from 'framer-motion'
import { ArrowRight, IndianRupee, PiggyBank, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateUpiLink } from '@/utils/upi'

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

export function DashboardPage() {
  const pending = [
    { name: 'Rahul', amount: 142, trip: 'Pondicherry Trip', upi: 'rahul@okhdfc' },
  ]
  const owedToYou = [{ name: 'Rahul', amount: 85, trip: 'Pondicherry Trip' }]

  const recent = [
    { who: 'Yashwanth', what: 'Auto', amount: 400, category: 'transport' },
    { who: 'Rahul', what: 'Lunch', amount: 850, category: 'food' },
    { who: 'Arun', what: 'Bus', amount: 300, category: 'transport' },
  ]

  const trips = [
    {
      id: 'pondy',
      name: 'Pondicherry Trip',
      members: 4,
      total: 4300,
      balance: -142,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'goa',
      name: 'Goa Weekend',
      members: 3,
      total: 7800,
      balance: 420,
      gradient: 'from-emerald-500 to-teal-600',
    },
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
          value="₹12,300"
          icon={IndianRupee}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          label="You Owe"
          value="₹142"
          icon={PiggyBank}
          iconBg="bg-gradient-to-br from-rose-500 to-pink-600"
        />
        <StatCard
          label="Owed To You"
          value="₹85"
          icon={ArrowRight}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/60 p-4"
              >
                <div>
                  <div className="font-semibold text-rose-700">
                    You owe {p.name} ₹{p.amount}
                  </div>
                  <div className="text-sm text-rose-700/70">{p.trip}</div>
                </div>
                <Button
                  onClick={() => {
                    window.location.href = generateUpiLink({
                      pa: p.upi,
                      pn: p.name,
                      am: p.amount,
                      tn: `${p.trip} payment`,
                    })
                  }}
                  className="h-8 rounded-xl bg-indigo-600 px-3 text-xs hover:bg-indigo-700"
                >
                  Pay Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Money Owed To You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {owedToYou.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
              >
                <div>
                  <div className="font-semibold text-emerald-700">
                    {p.name} owes you ₹{p.amount}
                  </div>
                  <div className="text-sm text-emerald-700/70">{p.trip}</div>
                </div>
                <Badge className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-600">
                  Pending
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="rounded-2xl border-gray-100 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((r, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-50"
              >
                <div>
                  <div className="text-sm font-medium">
                    {r.who} added expense <span className="text-gray-500">{r.what}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.category} · just now
                  </div>
                </div>
                <div className="text-sm font-semibold">₹{r.amount}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Trips</CardTitle>
            <a className="text-sm font-medium text-indigo-600 hover:text-indigo-700" href="/trips">
              View all
            </a>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={['h-24 bg-gradient-to-br', t.gradient].join(' ')}>
                    <div className="p-4">
                      <div className="text-lg font-bold text-white">{t.name}</div>
                      <div className="text-sm text-white/80">{t.members} members</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">Total spent</div>
                      <div className="font-semibold">₹{t.total}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="text-gray-500">Your balance</div>
                      <div
                        className={[
                          'font-semibold',
                          t.balance < 0 ? 'text-rose-600' : 'text-emerald-600',
                        ].join(' ')}
                      >
                        {t.balance < 0 ? `You owe ₹${Math.abs(t.balance)}` : `You receive ₹${t.balance}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

