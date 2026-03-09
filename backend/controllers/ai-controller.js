import { categorizeExpense } from '../services/categorize.js'
import { ocrStub } from '../services/ocr.js'
import { parseVoiceStub } from '../services/voice.js'

export async function ocrController(req, res) {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'Missing image file (field: image)' })
  }

  const result = await ocrStub(file)
  return res.json(result)
}

export async function categorizeController(req, res) {
  const { description, merchant } = req.body || {}
  const result = categorizeExpense({ description, merchant })
  return res.json(result)
}

export async function parseVoiceController(req, res) {
  const { transcript } = req.body || {}
  if (!transcript) return res.status(400).json({ error: 'Missing transcript' })
  return res.json(parseVoiceStub(transcript))
}

