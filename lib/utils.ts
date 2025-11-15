export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    return typeof msg === 'string' ? msg : String(msg)
  }
  return String(err ?? '')
}
