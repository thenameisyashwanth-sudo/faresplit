import { Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'

export function SignInPage() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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

            <Button
              onClick={signInWithGoogle}
              className="mt-7 h-12 w-full rounded-xl bg-indigo-600 text-base hover:bg-indigo-700"
            >
              Continue with Google
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

