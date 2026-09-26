/**
 * Creates a stable UTC date key for a user's local calendar day. Database
 * calendar fields such as HabitLog.date use this YYYY-MM-DD representation,
 * rather than the actual instant of local midnight.
 */
export function getCalendarDay(timezone?: string | null, now = new Date()): Date {
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const values = Object.fromEntries(
        parts
          .filter((part) => part.type !== 'literal')
          .map((part) => [part.type, part.value]),
      );
      return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
    } catch {
      // Use the process-local calendar as a backwards-compatible fallback for
      // malformed legacy timezone values.
    }
  }

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Adds whole calendar days to one of the UTC date keys above. */
export function addCalendarDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}
