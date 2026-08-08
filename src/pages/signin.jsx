import { Loader2, Sparkles, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { BackgroundBeams } from '@/components/ui/background-beams'
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
    <div className="relative min-h-screen bg-slate-950 px-6 py-10 grid place-items-center overflow-hidden">
      <BackgroundBeams />

      <div className="relative z-10 w-full max-w-sm">
        <Card className="w-full rounded-3xl border border-indigo-500/20 bg-slate-900/90 text-white shadow-2xl backdrop-blur-2xl">
          <CardContent className="p-8">
            <div className="grid place-items-center gap-3 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30">
                <Wallet className="h-7 w-7" />
              </div>
              <div className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                FareSplit
              </div>
              <div className="text-xs font-semibold text-indigo-300/80 flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" /> AI-Powered Expense Workspace
              </div>
            </div>

            {missingFirebaseConfig.length ? (
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code>,
                restart the dev server, then try again.
              </div>
            ) : null}

            {displayError ? (
              <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
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
              className="mt-8 h-12 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-base font-bold text-white hover:from-indigo-600 hover:to-pink-700 shadow-xl shadow-indigo-500/25 border border-indigo-400/30"
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

            <div className="mt-5 text-center text-[11px] text-gray-400 font-medium">
              By continuing, you agree to our Terms & Privacy Policy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
