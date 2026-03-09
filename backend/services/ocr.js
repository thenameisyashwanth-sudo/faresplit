export async function ocrStub(file) {
  const name = file?.originalname || 'receipt'
  const size = file?.size || 0

  // Stub implementation: integrate Tesseract or Google Vision here.
  return {
    provider: 'stub',
    file: { name, size },
    extracted: {
      merchant: null,
      totalAmount: null,
      date: null,
      currency: 'INR',
      rawText: '',
    },
  }
}

