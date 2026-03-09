import { Check, LogOut, Phone, User, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth-context'

function Field({ label, icon: Icon, value, onChange, placeholder, error }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="relative mt-2">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="h-11 rounded-xl pl-9"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {error ? <div className="mt-2 text-xs text-rose-600">{error}</div> : null}
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
    const t = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(t)
  }, [saved])

  const onSave = async () => {
    setError('')
    setUsernameError('')

    const desired = username.trim()
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
        fullName: fullName.trim(),
        username: desired,
        usernameLower: normalized,
        phoneNumber: phone.trim(),
        upiId: upi.trim(),
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

  return (
    <div className="space-y-6">
      {needsOnboarding ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          Finish setting up your profile to start using FareSplit.
        </div>
      ) : null}

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold">
              {profile?.fullName || user?.displayName || 'Your profile'}
            </div>
            <div className="truncate text-sm text-gray-500">
              {user?.email || profile?.email || ''}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Full Name"
            icon={User}
            value={fullName}
            onChange={setFullName}
            placeholder="Your name"
          />
          <Field
            label="Username (unique)"
            icon={User}
            value={username}
            onChange={setUsername}
            placeholder="your_username"
            error={usernameError}
          />
          <Field
            label="Phone"
            icon={Phone}
            value={phone}
            onChange={setPhone}
            placeholder="9876543210"
          />
          <Field
            label="UPI ID"
            icon={Wallet}
            value={upi}
            onChange={setUpi}
            placeholder="name@bank"
          />

          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <Button
            onClick={onSave}
            disabled={saving}
            className={[
              'h-11 rounded-xl px-5 transition',
              saved
                ? 'bg-emerald-600 hover:bg-emerald-600'
                : 'bg-indigo-600 hover:bg-indigo-700',
            ].join(' ')}
          >
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Saved!
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save changes'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-rose-600">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={logout}
            variant="outline"
            className="h-11 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

