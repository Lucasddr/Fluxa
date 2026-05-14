export function getPercentage(value: number, total: number) {
  return ((value / total) * 100).toFixed(0);
}