import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'

import { db } from '@/services/firebase'

export async function addExpense({
  tripId,
  amount,
  description,
  category,
  paidByUid,
  participantUids,
  billUrl,
  occurredAt,
}) {
  const expenseRef = await addDoc(collection(db, 'Expenses'), {
    tripId,
    amount: Number(amount),
    description: description?.trim() || '',
    category: category || 'Other',
    paidByUid,
    participantUids: participantUids || [],
    billUrl: billUrl || '',
    occurredAt: occurredAt ? new Date(occurredAt) : serverTimestamp(),
    createdAt: serverTimestamp(),
  })
  return expenseRef.id
}

export async function listTripExpenses(tripId) {
  const snap = await getDocs(
    query(
      collection(db, 'Expenses'),
      where('tripId', '==', tripId),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

