import {
  addDoc,
  collection,
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

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'Trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function listTripsForUser(uid) {
  const memberSnap = await getDocs(
    query(collection(db, 'TripMembers'), where('uid', '==', uid))
  )

  const tripIds = memberSnap.docs.map((d) => d.data().tripId).filter(Boolean)
  const trips = await Promise.all(tripIds.map((id) => getTrip(id)))
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


