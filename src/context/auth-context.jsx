import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (uid) => {
    if (!uid) return
    const ref = doc(db, 'Users', uid)
    const snap = await getDoc(ref)
    setProfile(snap.exists() ? snap.data() : null)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      setLoading(true)
      try {
        if (!fbUser) {
          setProfile(null)
          return
        }

        const ref = doc(db, 'Users', fbUser.uid)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          const baseProfile = {
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            fullName: fbUser.displayName ?? '',
            photoURL: fbUser.photoURL ?? '',
            username: '',
            usernameLower: '',
            phoneNumber: '',
            upiId: '',
            upiQrUrl: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
          await setDoc(ref, baseProfile)
          setProfile(baseProfile)
        } else {
          setProfile(snap.data())
        }
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const needsOnboarding = !!user && !loading && (!profile?.username || !profile?.usernameLower)

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
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
      signInWithGoogle,
      logout,
      refreshProfile,
      isUsernameAvailable,
      updateMyProfile,
    }),
    [user, profile, loading, needsOnboarding]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

