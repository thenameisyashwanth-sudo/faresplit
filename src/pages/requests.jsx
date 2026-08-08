import { Loader2, Mail, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { listPendingInvitesForUser, respondToInvite } from '@/services/firestore/invites'

export function RequestsPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState('')

  const loadRequests = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await listPendingInvitesForUser(user.uid)
      setPending(list)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [user])

  const handleAction = async (inviteId, accept) => {
    setRespondingId(inviteId)
    try {
      await respondToInvite({ inviteId, accept })
      await loadRequests()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Invite action failed:', err)
    } finally {
      setRespondingId('')
    }
  }

  if (loading) {
    return (
      <div className="grid h-64 place-items-center rounded-3xl border border-gray-100 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Pending Trip Invitations ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center sm:p-12">
              <Mail className="h-12 w-12 text-gray-300" />
              <div className="mt-3 text-lg font-semibold">No pending requests</div>
              <div className="mt-1 text-sm text-gray-500">
                When friends invite you to a trip using your username, invitations will appear here.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{r.tripName}</div>
                      <div className="text-sm text-gray-500">
                        Invited by <span className="font-medium text-gray-800">@{r.fromUsername}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 sm:pt-0">
                    <Button
                      variant="outline"
                      disabled={respondingId === r.id}
                      onClick={() => handleAction(r.id, false)}
                      className="h-10 flex-1 sm:flex-none rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="mr-1.5 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      disabled={respondingId === r.id}
                      onClick={() => handleAction(r.id, true)}
                      className="h-10 flex-1 sm:flex-none rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
                    >
                      {respondingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Accept'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
