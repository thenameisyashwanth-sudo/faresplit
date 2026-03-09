import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/require-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { AddExpensePage } from '@/pages/add-expense'
import { DashboardPage } from '@/pages/dashboard'
import { JoinTripPage } from '@/pages/join-trip'
import { ReportsPage } from '@/pages/reports'
import { RequestsPage } from '@/pages/requests'
import { SettingsPage } from '@/pages/settings'
import { SignInPage } from '@/pages/signin'
import { TripDetailPage } from '@/pages/trip-detail'
import { TripsPage } from '@/pages/trips'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/join/:tripId" element={<JoinTripPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/trips/:tripId/add-expense" element={<AddExpensePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
