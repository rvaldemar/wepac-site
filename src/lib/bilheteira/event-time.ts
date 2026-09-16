export function isPastEvent(startsAt: Date, now: Date = new Date()): boolean {
  return startsAt.getTime() < now.getTime();
}
