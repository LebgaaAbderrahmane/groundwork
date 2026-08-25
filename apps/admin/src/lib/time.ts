export type DaySchedule = { open: number; close: number }

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export const DAY_ABBREVS: Record<(typeof DAYS)[number], string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const MINUTES = [0, 15, 30, 45]

export function to12h(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60) % 24
  const m = minutesFromMidnight % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

export function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

export function parseMinutes(total: number): { hour: number; minute: number } {
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 }
}

export function formatSchedule(day: DaySchedule | null): string {
  if (!day) return 'Closed'
  return `${to12h(day.open)}–${to12h(day.close)}`
}

export function formatWeekSchedule(schedule: Partial<Record<(typeof DAYS)[number], DaySchedule | null>>): string {
  return DAYS.map((d) => {
    const s = schedule[d]
    return `${DAY_ABBREVS[d]} ${formatSchedule(s ?? null)}`
  }).join(' · ')
}

export function defaultSchedule(): Record<(typeof DAYS)[number], DaySchedule> {
  return Object.fromEntries(
    DAYS.map((d) => [d, { open: toMinutes(7, 0), close: toMinutes(17, 0) }]),
  ) as Record<(typeof DAYS)[number], DaySchedule>
}
