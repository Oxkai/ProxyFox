export function decodePaymentHeader(header: string) {
  const base64 = header.replace(/-/g, '+').replace(/_/g, '/')
  const jsonStr = Buffer.from(base64, 'base64').toString('utf-8')
  return JSON.parse(jsonStr)
}
