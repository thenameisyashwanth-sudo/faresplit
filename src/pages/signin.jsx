import { Loader2, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { missingFirebaseConfig } from '@/services/firebase'

export function SignInPage() {
  const { user, signInWithGoogle, authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const displayError = error || authError

  useEffect(() => {
    if (!user) return
    const from = location.state?.from || '/'
    navigate(from, { replace: true })
  }, [user, navigate, location.state])

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
              <div className="text-sm text-gray-500">
                AI-powered shared expense manager for trips
              </div>
            </div>

            {missingFirebaseConfig.length ? (
              <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code>,
                restart the dev server, then try again.
              </div>
            ) : null}

            {displayError ? (
              <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {displayError}
              </div>
            ) : null}

            <Button
              disabled={signingIn || missingFirebaseConfig.length > 0}
              onClick={async () => {
                setError('')
                setSigningIn(true)
                try {
                  await signInWithGoogle()
                } catch (err) {
                  setError(err?.message ?? 'Google sign-in failed. Please try again.')
                } finally {
                  setSigningIn(false)
                }
              }}
              className="mt-7 h-12 w-full rounded-xl bg-indigo-600 text-base hover:bg-indigo-700"
            >
              {signingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                'Continue with Google'
              )}
            </Button>

            <div className="mt-4 text-center text-xs text-gray-500">
              By continuing, you agree to our Terms & Privacy Policy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

