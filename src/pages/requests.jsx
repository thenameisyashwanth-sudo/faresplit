import { MapPin, Mail, X } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RequestsPage() {
  const pending = useMemo(
    () => [
      { id: '1', trip: 'Pondicherry Trip', invitedBy: 'yashwanth_s' },
      { id: '2', trip: 'Goa Weekend', invitedBy: 'rahul_07' },
    ],
    []
  )

  const past = useMemo(
    () => [
      { id: '3', trip: 'Bangalore Food Crawl', status: 'Accepted' },
      { id: '4', trip: 'Chennai One Day', status: 'Rejected' },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Pending Requests ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <Mail className="h-12 w-12 text-gray-200" />
              <div className="mt-3 text-lg font-semibold">No pending requests</div>
              <div className="mt-1 text-sm text-gray-500">
                You’ll see trip invitations here.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{r.trip}</div>
                      <div className="text-sm text-gray-500">
                        Invited by <span className="font-medium">{r.invitedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Past Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {past.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl p-3 transition hover:bg-gray-50"
            >
              <div className="text-sm font-medium">{r.trip}</div>
              <Badge
                className={[
                  'rounded-xl',
                  r.status === 'Accepted'
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-50',
                ].join(' ')}
              >
                {r.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

