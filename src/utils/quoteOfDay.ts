import { MOTIVATIONAL_QUOTES } from './quotes'

export function quoteOfDay() {
  const key = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[index]
}
