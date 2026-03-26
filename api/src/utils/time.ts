export function addDays(base: Date, days: number): Date {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  return value;
}
