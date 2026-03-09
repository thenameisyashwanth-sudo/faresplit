import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/context/auth-context'

export function RequireAuth({ children }) {
  const { user, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50/50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  if (needsOnboarding && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />
  }

  return children
}

