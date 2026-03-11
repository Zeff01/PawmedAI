export function cleanText(value: string) {
  return value.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\s+/g, ' ').trim()
}

export function splitIntoItems(value: string) {
  const cleaned = cleanText(value)
  const withIntroRemoved = cleaned.replace(
    /^.*?treatment typically involves:\s*/i,
    ''
  )
  const dashSplit = withIntroRemoved.split(/\s-\s+/).filter(Boolean)
  if (dashSplit.length > 1) {
    return dashSplit.map((item) => item.trim()).filter(Boolean)
  }
  const numbered = withIntroRemoved.split(/\s*\d+\.\s+/).filter(Boolean)
  if (numbered.length > 1) {
    return numbered.map((item) => item.trim()).filter(Boolean)
  }
  return withIntroRemoved
    .split(/[•\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
