export type PersonalTimer = { seconds: number; sessions: number }
export const timerText = (seconds: number) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map(n => String(n).padStart(2, '0')).join(':')
export function addMeasuredTime(timer: PersonalTimer, previous: number, now: number): PersonalTimer {
  // Long gaps (sleep / suspended browser) are not counted as work.
  const elapsed = Math.max(0, now - previous)
  return { ...timer, seconds: Math.min(6000000, timer.seconds + (elapsed <= 5000 ? elapsed / 1000 : 0)) }
}
