export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ''
  }

  const areaCode = digits.slice(0, 2)
  const firstDigit = digits.slice(2, 3)
  const subscriberPrefix = digits.slice(3, 7)
  const subscriberSuffix = digits.slice(7)

  return `(${areaCode}) ${firstDigit}${subscriberPrefix ? ` ${subscriberPrefix}` : ''}${subscriberSuffix ? `-${subscriberSuffix}` : ''}`
}
