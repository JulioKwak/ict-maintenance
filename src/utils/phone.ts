export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  const len = digits.length

  if (digits.startsWith('02')) {
    if (len <= 2) return digits
    if (len <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (len <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }

  if (len <= 3) return digits
  if (len <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (len <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}
