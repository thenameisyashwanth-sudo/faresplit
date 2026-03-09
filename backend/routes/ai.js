import express from 'express'
import multer from 'multer'

import {
  categorizeController,
  ocrController,
  parseVoiceController,
} from '../controllers/ai-controller.js'

const upload = multer({ storage: multer.memoryStorage() })

export const aiRouter = express.Router()

aiRouter.post('/ocr', upload.single('image'), ocrController)
aiRouter.post('/categorize', categorizeController)
aiRouter.post('/parse-voice', parseVoiceController)

