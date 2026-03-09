export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = Number(err?.status || 500)
  const message = err?.message || 'Server error'
  res.status(status).json({ error: message })
}

