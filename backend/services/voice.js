export function parseVoiceStub(transcript) {
  const t = String(transcript || '').toLowerCase()

  const amountMatch = t.match(/(\d+(?:\.\d+)?)/)
  const amount = amountMatch ? Number(amountMatch[1]) : null

  let category = 'Other'
  if (/(uber|ola|auto|bus|metro|train|cab)/.test(t)) category = 'Transport'
  if (/(pizza|domino|restaurant|lunch|dinner|breakfast|cafe)/.test(t)) category = 'Food'
  if (/(hotel|resort|stay)/.test(t)) category = 'Hotel'

  const participants = /for everyone|for all/.test(t) ? 'all' : 'selected'
  const description =
    transcript?.replace(amountMatch?.[0] ?? '', '').trim() || transcript

  return {
    provider: 'stub',
    transcript,
    extracted: {
      amount,
      description,
      category,
      participants,
    },
  }
}

