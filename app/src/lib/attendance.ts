// Attendance scheduling helper. Derives the list of class-session dates for a
// section from its weekly day-of-week + the semester bounds. Used by the lecturer
// attendance pages to build the date list a roster can be marked against.
// (Moved out of data/mock-attendance.ts when those pages became Prisma-backed.)

// Returns every ISO date string matching dayOfWeek (1=Mon…7=Sun, ISO convention)
// between startDate and endDate inclusive.
export function generateSessionDates(
  dayOfWeek: number,
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = []
  const end = new Date(endDate + 'T00:00:00')
  const current = new Date(startDate + 'T00:00:00')
  // JS getDay(): 0=Sun, 1=Mon…6=Sat; ISO dayOfWeek: 7=Sun, 1=Mon…6=Sat
  const jsDow = dayOfWeek === 7 ? 0 : dayOfWeek
  while (current.getDay() !== jsDow) current.setDate(current.getDate() + 1)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
  }
  return dates
}
