// Src/types/Rates/Rates.ts
//
// Shape of GET /account/todayrate (Src/Services/TodayRateService.js).

export interface Rates {
  GOLDRATE: number;
  SILVERRATE: number;
}

export type Metal = 'Gold' | 'Silver';

export interface RateHistoryResponse {
  Date: string;
  Rate: number;
}

export interface RateHistoryEntry {
  date: string;
  rate: number;
  change: number | null;
  changePct: number | null;
}
