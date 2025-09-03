/**
 * A simple utility function to format a date string or Date object.
 * @param date - The date to format.
 * @returns A formatted date string (e.g., "September 3, 2025").
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
