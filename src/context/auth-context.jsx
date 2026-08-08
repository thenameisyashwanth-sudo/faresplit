import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { auth, db } from '@/services/firebase'

const AuthContext = createContext(null)

function formatSignInError(err) {
  const code = err?.code ?? ''
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in was cancelled. Please try again.'
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups or try a different browser.'
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled in Firebase. Enable it under Authentication → Sign-in method.'
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method.'
  }
  const message = err?.message ?? 'Google sign-in failed. Please try again.'
  return code ? `${message} (${code})` : message
}

async function syncUserProfile(fbUser) {
  try {
    const ref = doc(db, 'Users', fbUser.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const defaultUsername = fbUser.email
        ? fbUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
        : `user_${fbUser.uid.slice(0, 6)}`
      const baseProfile = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        emailLower: (fbUser.email ?? '').toLowerCase(),
        fullName: fbUser.displayName ?? '',
        photoURL: fbUser.photoURL ?? '',
        username: defaultUsername,
        usernameLower: defaultUsername.toLowerCase(),
        phoneNumber: '',
        upiId: '',
        upiQrUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(ref, baseProfile)
      return baseProfile
    }

    const existing = snap.data()
    const patch = {}
    if (!existing.emailLower && fbUser.email) {
      patch.emailLower = fbUser.email.toLowerCase()
    }
    if (!existing.username) {
      const defaultUsername = fbUser.email
        ? fbUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
        : `user_${fbUser.uid.slice(0, 6)}`
      patch.username = defaultUsername
      patch.usernameLower = defaultUsername.toLowerCase()
    }
    if (Object.keys(patch).length > 0) {
      await updateDoc(ref, patch)
      return { ...existing, ...patch }
    }

    return existing
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FareSplit] Failed to sync user profile from Firestore:', err)
    return {
      uid: fbUser.uid,
      email: fbUser.email ?? '',
      emailLower: (fbUser.email ?? '').toLowerCase(),
      fullName: fbUser.displayName ?? '',
      photoURL: fbUser.photoURL ?? '',
      username: fbUser.email ? fbUser.email.split('@')[0] : 'user',
      usernameLower: fbUser.email ? fbUser.email.split('@')[0].toLowerCase() : 'user',
      phoneNumber: '',
      upiId: '',
      upiQrUrl: '',
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshProfile = async (uid) => {
    if (!uid) return
    try {
      const ref = doc(db, 'Users', uid)
      const snap = await getDoc(ref)
      setProfile(snap.exists() ? snap.data() : null)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Failed to refresh profile:', err)
    }
  }

  useEffect(() => {
    let unsub = () => {}

    const init = async () => {
      try {
        await getRedirectResult(auth)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Google redirect sign-in failed:', err)
        setAuthError(formatSignInError(err))
      }

      unsub = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser)

        if (!fbUser) {
          setProfile(null)
          setLoading(false)
          return
        }

        setAuthError('')

        syncUserProfile(fbUser)
          .then((p) => {
            setProfile(p)
            setLoading(false)
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[FareSplit] Profile load error:', err)
            setLoading(false)
          })
      })
    }

    init()
    return () => unsub()
  }, [])

  const needsOnboarding = !!user && !loading && (!profile?.username || !profile?.usernameLower)

  const signInWithGoogle = async () => {
    setAuthError('')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      return await signInWithPopup(auth, provider)
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (redirectErr) {
          const message = formatSignInError(redirectErr)
          setAuthError(message)
          throw new Error(message)
        }
      }
      // eslint-disable-next-line no-console
      console.error('[FareSplit] Google sign-in failed:', err)
      const message = formatSignInError(err)
      setAuthError(message)
      throw new Error(message)
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isUsernameAvailable = async (username, uid) => {
    const normalized = (username ?? '').trim().toLowerCase()
    if (!normalized) return false

    const q = query(
      collection(db, 'Users'),
      where('usernameLower', '==', normalized),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return true
    const doc0 = snap.docs[0]
    return doc0.id === uid
  }

  const updateMyProfile = async (patch) => {
    if (!user) throw new Error('Not authenticated')
    const ref = doc(db, 'Users', user.uid)
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
    await refreshProfile(user.uid)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      needsOnboarding,
      authError,
      signInWithGoogle,
      logout,
      refreshProfile,
      isUsernameAvailable,
      updateMyProfile,
    }),
    [user, profile, loading, needsOnboarding, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

