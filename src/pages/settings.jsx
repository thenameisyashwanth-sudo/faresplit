import { Camera, Check, Image as ImageIcon, LogOut, Phone, QrCode, Upload, User, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import QRCodeRaw from 'react-qr-code'

const QRCode =
  QRCodeRaw?.default?.default ||
  QRCodeRaw?.default?.QRCode ||
  QRCodeRaw?.QRCode ||
  QRCodeRaw?.default ||
  QRCodeRaw

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth-context'
import { generateUpiLink } from '@/utils/upi'

function Field({ label, icon: Icon, value, onChange, placeholder, error, type = 'text' }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="relative mt-2">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type={type}
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
  const [photoURL, setPhotoURL] = useState('')
  const [customQrUrl, setCustomQrUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    setFullName(profile?.fullName ?? user?.displayName ?? '')
    setUsername(profile?.username ?? '')
    setPhone(profile?.phoneNumber ?? '')
    setUpi(profile?.upiId ?? '')
    setPhotoURL(profile?.photoURL ?? user?.photoURL ?? '')
    setCustomQrUrl(profile?.customQrUrl ?? '')
  }, [profile, user])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image file size must be less than 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      setPhotoURL(evt.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Handle QR Code Image Upload
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('QR Code image file size must be less than 3MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      setCustomQrUrl(evt.target.result)
    }
    reader.readAsDataURL(file)
  }

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
        photoURL: photoURL || '',
        customQrUrl: customQrUrl || '',
      })

      setSaved(true)
    } catch (e) {
      setError(e?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => {
    const base = (fullName || user?.displayName || 'U').trim()
    return base ? base[0].toUpperCase() : 'U'
  }, [fullName, user?.displayName])

  const generatedUpiQrUrl = useMemo(() => {
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
          Please verify your username and UPI ID below once. Your profile will stay saved permanently.
        </div>
      ) : null}

      {/* Header Profile Card */}
      <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-lg"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-black text-white shadow-lg">
                  {initials}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-black text-gray-900">
                {fullName || user?.displayName || 'Your Profile'}
              </h2>
              <div className="truncate text-xs font-bold text-indigo-600 mt-0.5">
                @{username || 'username'}
              </div>
              <div className="truncate text-xs text-gray-500 mt-0.5">
                {user?.email || profile?.email || ''}
              </div>
            </div>
          </div>

          <Button
            onClick={onSave}
            disabled={saving}
            className={[
              'h-11 rounded-2xl px-6 font-bold shadow-md transition',
              saved ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700',
            ].join(' ')}
          >
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Profile Saved!
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Settings Form */}
        <Card className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900">Personal & Payment Details</CardTitle>
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

            {/* Profile Picture Attachment URL Input & Upload */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Profile Photo</div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    className="h-11 rounded-xl pl-10 text-xs"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="Paste image URL or click Attach to upload"
                  />
                </div>
                <label className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shrink-0">
                  <Upload className="h-4 w-4 text-indigo-600" /> Attach Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Custom / Auto QR Code Section */}
        <Card className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <QrCode className="h-4 w-4 text-indigo-600" /> Payment QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            {customQrUrl ? (
              <div className="space-y-3 w-full flex flex-col items-center">
                <div className="rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-md max-w-[200px] overflow-hidden">
                  <img src={customQrUrl} alt="Custom QR" className="w-full h-auto rounded-xl object-contain" />
                </div>
                <div className="text-xs font-bold text-indigo-600">Attached Custom Payment QR</div>
                <button
                  onClick={() => setCustomQrUrl('')}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove Custom QR (Use Auto-QR)
                </button>
              </div>
            ) : generatedUpiQrUrl ? (
              <>
                <div className="rounded-2xl border-2 border-indigo-100 bg-white p-3 shadow-md">
                  <QRCode value={generatedUpiQrUrl} size={150} />
                </div>
                <div className="mt-3 font-mono text-xs font-bold text-indigo-600">{upi}</div>
                <div className="mt-1 text-xs text-gray-500 font-medium">
                  Auto-generated from your UPI ID.
                </div>
              </>
            ) : (
              <div className="grid h-44 place-items-center rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 font-medium">
                Enter your UPI ID or attach a custom QR image below.
              </div>
            )}

            <div className="mt-4 w-full border-t border-gray-100 pt-3">
              <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/60 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">
                <Upload className="h-4 w-4 text-indigo-600" /> Attach Custom QR Image
                <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-xl">
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
