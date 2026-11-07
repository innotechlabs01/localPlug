export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let mismatch = a.length ^ b.length
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
      const aChar = i < a.length ? a.charCodeAt(i) : 0
      const bChar = i < b.length ? b.charCodeAt(i) : 0
      mismatch |= aChar ^ bChar
    }
    return mismatch === 0
  }
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
