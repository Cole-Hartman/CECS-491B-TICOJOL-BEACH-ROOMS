/**
 * Format a Date object to display time in "2:30 PM" format
 */
export function formatTimeDisplay(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Round a date to the nearest 5 minutes
 */
export function roundToNearestFiveMinutes(date: Date): Date {
  const rounded = new Date(date);
  const minutes = Math.round(rounded.getMinutes() / 5) * 5;
  rounded.setMinutes(minutes, 0, 0);
  return rounded;
}
