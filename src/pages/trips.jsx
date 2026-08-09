import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Loader2, Map, Plus, Sparkles, Trash2, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FocusCards } from '@/components/ui/focus-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth-context'
import { listTripExpenses } from '@/services/firestore/expenses'
import { ThreeDCardDemo } from '@/components/ui/3d-card-demo'
import { createTrip, deleteTrip, getTripMembers, listTripsForUser } from '@/services/firestore/trips'

const gradients = [
  'from-indigo-600 via-purple-600 to-indigo-800',
  'from-emerald-600 via-teal-600 to-emerald-800',
  'from-amber-500 via-orange-600 to-amber-700',
  'from-rose-600 via-pink-600 to-rose-800',
  'from-cyan-600 via-blue-600 to-cyan-800',
]

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-10 rounded-2xl px-5 text-xs font-bold transition duration-200',
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'border border-gray-200/80 bg-white/80 text-gray-600 hover:bg-white hover:text-indigo-600',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function TripsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [tripsData, setTripsData] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [newTripDesc, setNewTripDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchTrips = async () => {
    if (!user) return
    setLoading(true)
    try {
      const rawTrips = await listTripsForUser(user.uid)
      const enriched = await Promise.all(
        rawTrips.map(async (t, idx) => {
          let memberCount = 1
          let totalSpent = 0

          try {
            const members = await getTripMembers(t.id)
            memberCount = members.length || 1
          } catch (e) {
            // ignore
          }

          try {
            const expenses = await listTripExpenses(t.id)
            totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
          } catch (e) {
            // ignore
          }

          let formattedDate = 'Recently'
          if (t.createdAt?.toDate) {
            formattedDate = t.createdAt.toDate().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          }

          return {
            ...t,
            members: memberCount,
            total: totalSpent,
            status: t.status || 'Active',
            date: formattedDate,
            gradient: gradients[idx % gradients.length],
          }
        })
      )
      setTripsData(enriched)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Failed to load trips:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [user])

  const filteredTrips = useMemo(() => {
    if (filter === 'Active') return tripsData.filter((t) => t.status === 'Active')
    if (filter === 'Completed') return tripsData.filter((t) => t.status === 'Completed')
    return tripsData
  }, [filter, tripsData])

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handleCreateTrip = async (e) => {
    e.preventDefault()
    if (!newTripName.trim()) {
      setCreateError('Trip name is required')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      await createTrip({
        name: newTripName.trim(),
        description: newTripDesc.trim(),
        creatorUid: user.uid,
      })
      triggerCelebration()
      setNewTripName('')
      setNewTripDesc('')
      setIsModalOpen(false)
      await fetchTrips()
    } catch (err) {
      setCreateError(err?.message || 'Failed to create trip')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <FilterPill active={filter === 'All'} onClick={() => setFilter('All')}>
            All Trips
          </FilterPill>
          <FilterPill active={filter === 'Active'} onClick={() => setFilter('Active')}>
            Active
          </FilterPill>
          <FilterPill active={filter === 'Completed'} onClick={() => setFilter('Completed')}>
            Completed
          </FilterPill>
        </div>

        <Button
          onClick={() => {
            setCreateError('')
            setIsModalOpen(true)
          }}
          className="h-11 w-full rounded-2xl bg-indigo-600 px-6 font-bold hover:bg-indigo-700 sm:w-auto shadow-lg shadow-indigo-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Trip
        </Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid h-64 place-items-center rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-xl">
          <ThreeDCardDemo
            title="Create Your Next Group Trip ✨"
            description="Hover over this 3D card to experience perspective motion. Start logging shared expenses, split bills equally or unequally, and settle up via UPI instantly."
            buttonText="Create Trip Now"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : (
        <FocusCards
          items={filteredTrips}
          renderCard={(t) => (
            <div className="group relative w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl backdrop-blur-xl transition duration-300">
              <div className={['h-36 bg-gradient-to-br p-5 text-white', t.gradient].join(' ')}>
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20">
                      {t.status}
                    </Badge>
                    {user && t.creatorUid === user.uid ? (
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (window.confirm(`Are you sure you want to delete "${t.name}"?`)) {
                            await deleteTrip(t.id)
                            fetchTrips()
                          }
                        }}
                        title="Delete Trip"
                        className="rounded-full bg-white/10 p-1.5 text-white/70 backdrop-blur-md transition hover:bg-rose-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <div className="text-xl font-black text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-white/80 font-medium truncate mt-0.5">
                      {t.description || 'Shared trip'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white/90">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    {t.members} member{t.members !== 1 ? 's' : ''}
                  </div>
                  <div>{t.date}</div>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <span className="text-xs font-semibold text-gray-500">Total spent</span>
                  <span className="text-lg font-black text-gray-900">₹{t.total.toLocaleString('en-IN')}</span>
                </div>

                <Link
                  to={`/trips/${t.id}`}
                  className="mt-4 block w-full text-center rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md"
                >
                  Open Trip Workspace →
                </Link>
              </div>
            </div>
          )}
        />
      )}

      {/* Create Trip Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Create New Trip
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Trip Name</label>
                <Input
                  className="mt-1.5 h-11 rounded-xl"
                  placeholder="e.g., Goa Trip, Weekend Dinner"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Description (Optional)</label>
                <Input
                  className="mt-1.5 h-11 rounded-xl"
                  placeholder="e.g., Beach vibes, hotel stay, food"
                  value={newTripDesc}
                  onChange={(e) => setNewTripDesc(e.target.value)}
                />
              </div>

              {createError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {createError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="h-11 rounded-xl bg-indigo-600 px-6 font-bold hover:bg-indigo-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Trip'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
