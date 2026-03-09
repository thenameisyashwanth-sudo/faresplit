export function generateUpiLink({
  pa,
  pn,
  am,
  cu = 'INR',
  tn,
}) {
  const params = new URLSearchParams()
  if (pa) params.set('pa', pa)
  if (pn) params.set('pn', pn)
  if (am != null && am !== '') params.set('am', String(am))
  if (cu) params.set('cu', cu)
  if (tn) params.set('tn', tn)
  return `upi://pay?${params.toString()}`
}

