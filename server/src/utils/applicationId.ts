/**
 * Application ID generator.
 * Format: AF-YYYYMMDD-XXXXXX (6 random uppercase alphanumeric chars)
 * Example: AF-20241015-3X8KJ2
 */

export function generateApplicationId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 8).padEnd(6, '0');
  return `AF-${datePart}-${randomPart}`;
}
