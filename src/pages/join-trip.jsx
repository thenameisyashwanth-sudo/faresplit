import { Check, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function JoinTripPage() {
  const { tripId } = useParams()
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!joined) return
    const t = setTimeout(() => {
      window.location.href = `/trips/${tripId}`
    }, 1200)
    return () => clearTimeout(t)
  }, [joined, tripId])

  const trip = {
    name: 'Pondicherry Trip',
    description: 'Beach vibes, cafés, and sunsets.',
    members: 4,
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

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{trip.name}</div>
                  <div className="text-sm text-gray-500">{trip.description}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {trip.members} members · code: <span className="font-mono">{tripId}</span>
                  </div>
                </div>
              </div>
            </div>

            {!joined ? (
              <Button
                onClick={() => setJoined(true)}
                className="mt-6 h-12 w-full rounded-xl bg-indigo-600 text-base hover:bg-indigo-700"
              >
                Join Trip
              </Button>
            ) : (
              <div className="mt-6 grid place-items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-5 w-5" />
                </div>
                <div className="font-semibold text-emerald-800">
                  You&apos;ve joined!
                </div>
                <div className="text-sm text-emerald-700/80">Redirecting…</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

