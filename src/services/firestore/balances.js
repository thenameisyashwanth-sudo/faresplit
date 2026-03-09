export function computeNetBalancesFromExpenses(expenses) {
  const net = {}

  for (const e of expenses || []) {
    const amount = Number(e.amount || 0)
    if (!amount) continue

    const participants = Array.isArray(e.participantUids) ? e.participantUids : []
    const count = participants.length || 1
    const share = amount / count

    const paidBy = e.paidByUid
    if (paidBy) net[paidBy] = (net[paidBy] || 0) + amount

    for (const uid of participants) {
      net[uid] = (net[uid] || 0) - share
    }
  }

  for (const [k, v] of Object.entries(net)) {
    net[k] = Math.round(v * 100) / 100
  }

  return net
}

