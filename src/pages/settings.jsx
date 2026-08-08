import { Check, LogOut, Phone, QrCode, User, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import QRCodeRaw from 'react-qr-code'

const QRCode =
  QRCodeRaw?.default?.default ||
  QRCodeRaw?.default?.QRCode ||
  QRCodeRaw?.QRCode ||
  QRCodeRaw?.default ||
  QRCodeRaw

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth-context'
import { generateUpiLink } from '@/utils/upi'

function Field({ label, icon: Icon, value, onChange, placeholder, error }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="relative mt-2">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="h-11 rounded-xl pl-10 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {error ? <div className="mt-1.5 text-xs font-semibold text-rose-600">{error}</div> : null}
    </div>
  )
}

export function SettingsPage() {
  const { user, profile, needsOnboarding, logout, isUsernameAvailable, updateMyProfile } =
    useAuth()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [upi, setUpi] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    setFullName(profile?.fullName ?? user?.displayName ?? '')
    setUsername(profile?.username ?? '')
    setPhone(profile?.phoneNumber ?? '')
    setUpi(profile?.upiId ?? '')
  }, [profile, user])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  const onSave = async () => {
    setError('')
    setUsernameError('')

    const desired = (username || '').trim()
    const normalized = desired.toLowerCase()
    if (!desired) {
      setUsernameError('Username is required.')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(desired)) {
      setUsernameError('Use 3–20 characters: letters, numbers, underscore.')
      return
    }

    setSaving(true)
    try {
      const ok = await isUsernameAvailable(desired, user?.uid)
      if (!ok) {
        setUsernameError('That username is already taken.')
        return
      }

      await updateMyProfile({
        fullName: (fullName || '').trim(),
        username: desired,
        usernameLower: normalized,
        phoneNumber: (phone || '').trim(),
        upiId: (upi || '').trim(),
      })

      setSaved(true)
    } catch (e) {
      setError(e?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => {
    const base = (profile?.fullName || user?.displayName || 'U').trim()
    return base ? base[0].toUpperCase() : 'U'
  }, [profile?.fullName, user?.displayName])

  const upiQrUrl = useMemo(() => {
    if (!upi.trim()) return ''
    return generateUpiLink({
      pa: upi.trim(),
      pn: fullName || username || 'User',
      am: 0,
      tn: 'FareSplit QR',
    })
  }, [upi, fullName, username])

  return (
    <div className="space-y-6">
      {needsOnboarding ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 shadow-sm">
          Finish setting up your username and UPI ID below to start using FareSplit.
        </div>
      ) : null}

      {/* 3D Profile Card */}
      <CardContainer containerClassName="py-0 w-full">
        <CardBody className="w-full rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CardItem translateZ="40" className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-black text-white shadow-lg">
                {initials}
              </CardItem>
              <div className="min-w-0 flex-1">
                <CardItem translateZ="30" className="truncate text-xl font-extrabold text-gray-900">
                  {profile?.fullName || user?.displayName || 'Your Profile'}
                </CardItem>

                <CardItem translateZ="20" className="truncate text-xs font-semibold text-indigo-600 mt-0.5">
                  @{profile?.username || 'username_not_set'}
                </CardItem>

                <CardItem translateZ="10" className="truncate text-xs text-gray-500">
                  {user?.email || profile?.email || ''}
                </CardItem>
              </div>
            </div>
          </div>
        </CardBody>
      </CardContainer>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Settings Form */}
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Profile & Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Full Name"
              icon={User}
              value={fullName}
              onChange={setFullName}
              placeholder="Your full name"
            />
            <Field
              label="Unique Username (@username)"
              icon={User}
              value={username}
              onChange={setUsername}
              placeholder="your_username"
              error={usernameError}
            />
            <Field
              label="Phone Number"
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="9876543210"
            />
            <Field
              label="UPI ID (Google Pay / PhonePe / Paytm / BHIM)"
              icon={Wallet}
              value={upi}
              onChange={setUpi}
              placeholder="name@okicici or 9876543210@ybl"
            />

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <Button
              onClick={onSave}
              disabled={saving}
              className={[
                'h-11 rounded-xl px-6 font-bold transition shadow-md',
                saved
                  ? 'bg-emerald-600 hover:bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-700',
              ].join(' ')}
            >
              {saved ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Profile Saved!
                </>
              ) : saving ? (
                'Saving Profile...'
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* UPI QR Code Preview Card */}
        <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <QrCode className="h-4 w-4 text-indigo-600" /> Your UPI QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            {upiQrUrl ? (
              <>
                <div className="rounded-2xl border-2 border-indigo-100 bg-white p-3 shadow-md">
                  <QRCode value={upiQrUrl} size={150} />
                </div>
                <div className="mt-3 font-mono text-xs font-bold text-indigo-600">{upi}</div>
                <div className="mt-1 text-xs text-gray-500 font-medium">
                  Friends can scan this QR code with GPay, PhonePe, or Paytm to pay you.
                </div>
              </>
            ) : (
              <div className="grid h-44 place-items-center rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 font-medium">
                Enter your UPI ID on the left to generate your personal scannable QR code!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-rose-600">Account Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={logout}
            variant="outline"
            className="h-11 rounded-xl border-rose-200 font-bold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
