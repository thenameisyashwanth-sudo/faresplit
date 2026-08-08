import {
  addDoc,
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

import { db } from '@/services/firebase'
import { tripMemberDocId } from '@/services/firestore/ids'

export async function inviteUserToTripByUsername({
  tripId,
  fromUid,
  toUsername,
}) {
  const usernameLower = (toUsername ?? '').trim().toLowerCase()
  if (!usernameLower) throw new Error('Username is required')

  const userSnap = await getDocs(
    query(
      collection(db, 'Users'),
      where('usernameLower', '==', usernameLower),
      limit(1)
    )
  )
  if (userSnap.empty) throw new Error('User not found')
  const toUid = userSnap.docs[0].id

  const inviteRef = await addDoc(collection(db, 'TripInvites'), {
    tripId,
    fromUid,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    respondedAt: null,
  })

  await addDoc(collection(db, 'Notifications'), {
    uid: toUid,
    type: 'trip_invite',
    title: 'New trip invitation',
    data: { tripId, fromUid, inviteId: inviteRef.id },
    read: false,
    createdAt: serverTimestamp(),
  })

  return inviteRef.id
}

export async function listPendingInvitesForUser(uid) {
  const inviteSnap = await getDocs(
    query(
      collection(db, 'TripInvites'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    )
  )
  const invites = inviteSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  return Promise.all(
    invites.map(async (inv) => {
      let tripName = 'Trip'
      let fromUsername = 'User'
      if (inv.tripId) {
        const tSnap = await getDoc(doc(db, 'Trips', inv.tripId))
        if (tSnap.exists()) tripName = tSnap.data().name || 'Trip'
      }
      if (inv.fromUid) {
        const uSnap = await getDoc(doc(db, 'Users', inv.fromUid))
        if (uSnap.exists()) {
          const uData = uSnap.data()
          fromUsername = uData.username || uData.fullName || 'User'
        }
      }
      return { ...inv, tripName, fromUsername }
    })
  )
}

export async function respondToInvite({ inviteId, accept }) {
  const ref = doc(db, 'TripInvites', inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Invite not found')

  const invite = snap.data()
  await updateDoc(ref, {
    status: accept ? 'accepted' : 'rejected',
    respondedAt: serverTimestamp(),
  })

  if (accept) {
    await setDoc(doc(db, 'TripMembers', tripMemberDocId(invite.tripId, invite.toUid)), {
      tripId: invite.tripId,
      uid: invite.toUid,
      role: 'member',
      joinedAt: serverTimestamp(),
    })
  }

  return true
}

export async function joinTripByCode({ tripId, uid }) {
  const tripSnap = await getDoc(doc(db, 'Trips', tripId))
  if (!tripSnap.exists()) throw new Error('Trip not found')

  await setDoc(doc(db, 'TripMembers', tripMemberDocId(tripId, uid)), {
    tripId,
    uid,
    role: 'member',
    joinedAt: serverTimestamp(),
  })
  return true
}


