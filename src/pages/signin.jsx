import { Loader2, Sparkles, Wallet } from 'lucide-react'
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 px-6 py-10 grid place-items-center">
      <div className="w-full max-w-sm">
        <Card className="w-full rounded-3xl border border-gray-100 bg-white/90 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="grid place-items-center gap-3 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
                <Wallet className="h-7 w-7" />
              </div>
              <div className="text-3xl font-black tracking-tight text-gray-900">
                FareSplit
              </div>
              <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Smart Expense Workspace
              </div>
            </div>

            {missingFirebaseConfig.length ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-medium">
                Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code>,
                restart the dev server, then try again.
              </div>
            ) : null}

            {displayError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
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
              className="mt-8 h-12 w-full rounded-2xl bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200"
            >
              {signingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                'Continue with Google'
              )}
            </Button>

            <div className="mt-5 text-center text-[11px] text-gray-500 font-medium">
              By continuing, you agree to our Terms & Privacy Policy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
