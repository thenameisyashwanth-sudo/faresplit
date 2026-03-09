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
  return inviteSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
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

