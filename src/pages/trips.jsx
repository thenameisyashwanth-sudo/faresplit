import { motion } from 'framer-motion'
import { Map, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const allTrips = [
  {
    id: 'pondy',
    name: 'Pondicherry Trip',
    description: 'Beach vibes, cafés, and sunsets.',
    members: 4,
    total: 4300,
    status: 'Active',
    date: 'Mar 2, 2026',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'goa',
    name: 'Goa Weekend',
    description: 'Seafood and sand.',
    members: 3,
    total: 7800,
    status: 'Completed',
    date: 'Feb 11, 2026',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'blr',
    name: 'Bangalore Food Crawl',
    description: 'Dosas, filter coffee, and more.',
    members: 5,
    total: 5600,
    status: 'Active',
    date: 'Jan 21, 2026',
    gradient: 'from-emerald-500 to-teal-600',
  },
]

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-10 rounded-xl px-4 text-sm font-medium transition',
        active
          ? 'bg-indigo-600 text-white shadow-md'
          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function TripsPage() {
  const [filter, setFilter] = useState('All')

  const trips = useMemo(() => {
    if (filter === 'Active') return allTrips.filter((t) => t.status === 'Active')
    if (filter === 'Completed')
      return allTrips.filter((t) => t.status === 'Completed')
    return allTrips
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <FilterPill active={filter === 'All'} onClick={() => setFilter('All')}>
            All
          </FilterPill>
          <FilterPill
            active={filter === 'Active'}
            onClick={() => setFilter('Active')}
          >
            Active
          </FilterPill>
          <FilterPill
            active={filter === 'Completed'}
            onClick={() => setFilter('Completed')}
          >
            Completed
          </FilterPill>
        </div>

        <Button className="h-11 rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <Map className="h-12 w-12 text-gray-200" />
          <div className="mt-3 text-lg font-semibold">No trips yet</div>
          <div className="mt-1 text-sm text-gray-500">
            Create a trip to start splitting expenses.
          </div>
          <Button className="mt-4 h-11 rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700">
            Create Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className={['h-32 bg-gradient-to-br', t.gradient].join(' ')}>
                  <div className="flex h-full flex-col justify-between p-5">
                    <div>
                      <Badge className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                        {t.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{t.name}</div>
                      <div className="text-sm text-white/80">{t.description}</div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t.members} members
                    </div>
                    <div>{t.date}</div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div className="text-sm text-gray-500">Total spent</div>
                    <div className="text-lg font-bold">₹{t.total}</div>
                  </div>

                  <Link
                    to={`/trips/${t.id}`}
                    className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Open trip →
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

