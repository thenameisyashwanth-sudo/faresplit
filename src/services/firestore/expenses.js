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
  if (!tripId) return []
  try {
    const snap = await getDocs(
      query(collection(db, 'Expenses'), where('tripId', '==', tripId))
    )
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    return list.sort((a, b) => {
      const getMs = (item) => {
        if (item.createdAt?.toMillis) return item.createdAt.toMillis()
        if (item.createdAt?.seconds) return item.createdAt.seconds * 1000
        if (item.occurredAt?.toMillis) return item.occurredAt.toMillis()
        if (item.occurredAt?.seconds) return item.occurredAt.seconds * 1000
        if (item.occurredAt) return new Date(item.occurredAt).getTime() || 0
        return 0
      }
      return getMs(b) - getMs(a)
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FareSplit] Failed to list trip expenses:', err)
    return []
  }
}

