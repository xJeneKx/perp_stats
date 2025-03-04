export function getTimestamp30DaysAgo(): number {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return Math.floor(date.getTime() / 1000);
}
