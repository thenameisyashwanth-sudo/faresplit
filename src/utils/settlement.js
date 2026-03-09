export function minimizeTransactions(netBalances) {
  const creditors = []
  const debtors = []

  for (const [id, amountRaw] of Object.entries(netBalances || {})) {
    const amount = Number(amountRaw || 0)
    if (amount > 0) creditors.push({ id, amount })
    else if (amount < 0) debtors.push({ id, amount: -amount })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const txns = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]
    const c = creditors[j]
    const pay = Math.min(d.amount, c.amount)

    if (pay > 0) {
      txns.push({
        from: d.id,
        to: c.id,
        amount: Math.round(pay * 100) / 100,
      })
    }

    d.amount -= pay
    c.amount -= pay

    if (d.amount <= 1e-9) i += 1
    if (c.amount <= 1e-9) j += 1
  }

  return txns
}

