// Src/types/Scheme/Scheme.ts
//
// Scheme catalog + per-scheme amount options. Field names match
// Src/Services/SchemeNameService.js and Src/Services/SchemeAmountService.js.

export interface SchemeGroupOption {
  GROUPCODE: string;
  AMOUNT: number;
  CURRENTREGNO: number;
}

export interface Scheme {
  SchemeId: number;
  schemeName: string;
  SchemeSName?: string;
  MetalType?: string; // 'G' | 'S' | 'B' | 'C'
  WeightLedger?: 'Y' | 'N';
  FixedIns?: 'Y' | 'N';
  Instalment?: number;
}

export type SchemeListResponse = Scheme[];
export type SchemeGroupOptionsResponse = SchemeGroupOption[];
