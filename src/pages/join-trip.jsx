import { Check, Loader2, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { joinTripByCode } from '@/services/firestore/invites'
import { getTrip, getTripMembers } from '@/services/firestore/trips'

export function JoinTripPage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [membersCount, setMembersCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) return
    const loadTripData = async () => {
      setLoading(true)
      try {
        const tData = await getTrip(tripId)
        setTrip(tData)
        if (tData) {
          const mList = await getTripMembers(tripId)
          setMembersCount(mList.length)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Failed to load trip invite:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTripData()
  }, [tripId])

  const handleJoin = async () => {
    if (!user) {
      navigate('/signin', { state: { from: `/join/${tripId}` } })
      return
    }
    setJoining(true)
    setError('')
    try {
      await joinTripByCode({ tripId, uid: user.uid })
      setJoined(true)
      setTimeout(() => {
        navigate(`/trips/${tripId}`)
      }, 1200)
    } catch (err) {
      setError(err?.message || 'Failed to join trip')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-10 grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-10">
      <div className="mx-auto grid max-w-sm place-items-center">
        <Card className="w-full rounded-3xl border-gray-100 shadow-xl">
          <CardContent className="p-8">
            <div className="grid place-items-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold tracking-tight">FareSplit</div>
              <div className="text-sm text-gray-500">Join trip invitation</div>
            </div>

            {!trip ? (
              <div className="mt-6 text-center text-sm text-gray-500">
                Invalid or expired trip invite link.
                <div className="mt-4">
                  <Button asChild className="rounded-xl bg-indigo-600">
                    <Link to="/trips">Go to My Trips</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold">{trip.name}</div>
                      <div className="text-sm text-gray-500">{trip.description || 'Shared expense trip'}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        {membersCount} member{membersCount !== 1 ? 's' : ''} · code: <span className="font-mono">{tripId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    {error}
                  </div>
                ) : null}

                {!joined ? (
                  <Button
                    onClick={handleJoin}
                    disabled={joining}
                    className="mt-6 h-12 w-full rounded-xl bg-indigo-600 text-base hover:bg-indigo-700"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Trip'
                    )}
                  </Button>
                ) : (
                  <div className="mt-6 grid place-items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-emerald-800">
                      You&apos;ve joined!
                    </div>
                    <div className="text-sm text-emerald-700/80">Redirecting to trip...</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
