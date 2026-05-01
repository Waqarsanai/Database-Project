export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m
  }
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

