import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'

import { db } from '@/services/firebase'
import { tripMemberDocId } from '@/services/firestore/ids'

export async function createTrip({ name, description, creatorUid }) {
  const tripRef = await addDoc(collection(db, 'Trips'), {
    name: name?.trim() || '',
    description: description?.trim() || '',
    creatorUid,
    status: 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'TripMembers', tripMemberDocId(tripRef.id, creatorUid)), {
    tripId: tripRef.id,
    uid: creatorUid,
    role: 'creator',
    joinedAt: serverTimestamp(),
  })

  return tripRef.id
}

export async function deleteTrip(tripId) {
  if (!tripId) return false

  try {
    await deleteDoc(doc(db, 'Trips', tripId))
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[FareSplit] Error deleting main trip document:', err)
  }

  try {
    const memberSnap = await getDocs(
      query(collection(db, 'TripMembers'), where('tripId', '==', tripId))
    )
    await Promise.all(memberSnap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    // ignore
  }

  try {
    const expenseSnap = await getDocs(
      query(collection(db, 'Expenses'), where('tripId', '==', tripId))
    )
    await Promise.all(expenseSnap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    // ignore
  }

  try {
    const inviteSnap = await getDocs(
      query(collection(db, 'TripInvites'), where('tripId', '==', tripId))
    )
    await Promise.all(inviteSnap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    // ignore
  }

  return true
}

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'Trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function listTripsForUser(uid) {
  if (!uid) return []
  const memberTripIds = []
  const creatorTripIds = []

  try {
    const memberSnap = await getDocs(
      query(collection(db, 'TripMembers'), where('uid', '==', uid))
    )
    memberSnap.docs.forEach((d) => {
      const tid = d.data().tripId
      if (tid) memberTripIds.push(tid)
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[FareSplit] TripMembers query error:', err)
  }

  try {
    const creatorSnap = await getDocs(
      query(collection(db, 'Trips'), where('creatorUid', '==', uid))
    )
    creatorSnap.docs.forEach((d) => creatorTripIds.push(d.id))
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[FareSplit] Trips creator query error:', err)
  }

  let allIds = Array.from(new Set([...memberTripIds, ...creatorTripIds]))

  // Fallback: If query returned no IDs (e.g. missing Firestore index or permissions issue), fetch all trips and filter by creatorUid
  if (allIds.length === 0) {
    try {
      const allTripsSnap = await getDocs(collection(db, 'Trips'))
      allTripsSnap.docs.forEach((d) => {
        const data = d.data()
        if (data.creatorUid === uid) {
          allIds.push(d.id)
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[FareSplit] Fallback trips fetch error:', err)
    }
  }

  const trips = await Promise.all(allIds.map((id) => getTrip(id)))
  return trips.filter(Boolean)
}

export async function getTripMembers(tripId) {
  const memberSnap = await getDocs(
    query(collection(db, 'TripMembers'), where('tripId', '==', tripId))
  )
  const membersData = memberSnap.docs.map((d) => d.data())
  
  const profiles = await Promise.all(
    membersData.map(async (m) => {
      const userSnap = await getDoc(doc(db, 'Users', m.uid))
      const userData = userSnap.exists() ? userSnap.data() : {}
      return {
        uid: m.uid,
        role: m.role || 'member',
        name: userData.fullName || userData.username || 'User',
        fullName: userData.fullName || '',
        username: userData.username || '',
        email: userData.email || '',
        upiId: userData.upiId || '',
        photoURL: userData.photoURL || '',
      }
    })
  )
  return profiles
}



