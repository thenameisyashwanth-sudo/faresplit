const rules = [
  { category: 'Food', keywords: ['domino', 'pizza', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast'] },
  { category: 'Transport', keywords: ['uber', 'ola', 'auto', 'bus', 'metro', 'train', 'flight', 'cab'] },
  { category: 'Hotel', keywords: ['hotel', 'resort', 'stay', 'booking'] },
  { category: 'Fuel', keywords: ['fuel', 'petrol', 'diesel'] },
  { category: 'Groceries', keywords: ['grocery', 'supermarket', 'mart'] },
  { category: 'Shopping', keywords: ['mall', 'shopping'] },
  { category: 'Tickets', keywords: ['ticket', 'entry'] },
  { category: 'Medical', keywords: ['pharmacy', 'medical'] },
]

export function categorizeExpense({ description, merchant }) {
  const text = `${merchant || ''} ${description || ''}`.toLowerCase()

  for (const r of rules) {
    if (r.keywords.some((k) => text.includes(k))) {
      return { category: r.category, confidence: 0.72 }
    }
  }

  return { category: 'Other', confidence: 0.4 }
}

