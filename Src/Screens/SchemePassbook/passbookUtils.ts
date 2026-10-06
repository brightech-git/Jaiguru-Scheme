export const toNumber = (value: unknown): number => {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
};
export const money = (value: unknown) => `₹ ${toNumber(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function dateLabel(raw?: string): string {
  if (!raw || raw.startsWith('1900-01-01')) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw;
}
export function paidThisMonth(raw?: string): boolean {
  const today = new Date();
  return !!raw && raw.slice(0, 7) === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}
