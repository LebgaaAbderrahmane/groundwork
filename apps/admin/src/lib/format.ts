const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function dollars(cents: number): string {
  return formatter.format(cents / 100)
}

export function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.max(0, Math.round(ms / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m ago`
}

export function clockTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
