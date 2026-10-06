// Src/api/services/ratesService.ts
import { callApi } from '../apiClient';
import { ACCOUNT } from '../endpoints';
import { Rates, RateHistoryResponse, RateHistoryEntry } from '../../types/Rates/Rates';

export function normalizeRateHistory(rows: RateHistoryResponse[]): RateHistoryEntry[] {
  const entries = new Map<string, number>();
  for (const row of rows) {
    const rate = Number(row.Rate);
    if (typeof row.Date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.Date) && Number.isFinite(rate) && rate > 0) {
      entries.set(row.Date, rate);
    }
  }
  const sorted = [...entries].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([date, rate], index) => {
    const previous = index > 0 ? sorted[index - 1][1] : null;
    const change = previous === null ? null : rate - previous;
    return { date, rate, change, changePct: previous === null ? null : (change! / previous) * 100 };
  });
}

export const ratesService = {
  getHistory: async (metalId: 'G' | 'S' = 'G'): Promise<RateHistoryEntry[]> => {
    const rows = await callApi<null, RateHistoryResponse[]>({
      method: 'get',
      url: ACCOUNT.RATE_HISTORY,
      params: { METALID: metalId },
    });
    if (!Array.isArray(rows)) throw new Error('Invalid rate history response');
    return normalizeRateHistory(rows);
  },
  /** GET /account/todayrate -> { GOLDRATE, SILVERRATE } */
  getTodayRate: () =>
    callApi<null, Rates>({
      method: 'get',
      url: ACCOUNT.TODAY_RATE,
    }),
};
