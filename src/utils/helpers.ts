/** 전화번호 하이픈 포맷 — 01012345678 → 010-1234-5678 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return phone
}

/** 만 나이 표시 — "만N세" */
export function formatAge(birthDate: string | undefined | null, referenceDate?: string): string {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  const ref = referenceDate ? new Date(referenceDate) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--
  return `만${age}세`
}
