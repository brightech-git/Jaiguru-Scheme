export interface SchemeJoinSuccessDetails {
  userName: string;
  schemeName: string;
  amount: number;
  personalId?: string;
  regNo?: string;
  groupCode?: string;
  joinDate?: string;
  sno?: string;
  goldWeight?: number;
  goldRate?: number;
  receiptNo?: string;
  installment?: string;
}

export function buildSchemeJoinSuccess(
  processResult: unknown,
  fallback: { userName: string; schemeName?: string; amount: number | null; groupCode?: string },
): SchemeJoinSuccessDetails {
  let value: unknown = processResult;
  let parsed: Record<string, unknown> = {};
  for (let attempt = 0; attempt < 6; attempt++) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (record.processResult != null) { value = record.processResult; continue; }
      if (record.data && typeof record.data === 'object') { value = record.data; continue; }
      parsed = record;
      break;
    }
    if (typeof value !== 'string') break;
    const raw = value.replace(/^\s*PROCESSED:\s*/i, '').trim();
    try { value = JSON.parse(raw); } catch {
      if (raw.includes('\\"')) {
        try { value = JSON.parse(raw.replace(/\\"/g, '"')); continue; } catch { /* Try the legacy map below. */ }
      }
      for (const pair of raw.replace(/[{}]/g, '').split(/,\s*/)) {
        const separator = pair.indexOf('=');
        if (separator > 0) parsed[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim();
      }
      break;
    }
  }
  const text = (value: unknown): string | undefined => value == null || value === 'null' || value === '' ? undefined : String(value);
  const numeric = (value: unknown): number | undefined => {
    if (value == null || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : undefined;
  };
  const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row) && !row.CANCEL)
    : [];
  const transactions = rows(parsed.schemeTran);
  const collections = rows(parsed.schemeCollect);
  const weights = transactions.map(row => numeric(row.WEIGHT)).filter((value): value is number => value !== undefined);
  return {
    userName: fallback.userName.trim() || 'Member',
    schemeName: fallback.schemeName || 'Jewellery savings scheme',
    amount: numeric(parsed.amount) ?? numeric(collections[0]?.AMOUNT) ?? fallback.amount ?? 0,
    personalId: text(parsed.personalId),
    regNo: text(parsed.regNo ?? transactions[0]?.REGNO ?? collections[0]?.REGNO),
    groupCode: text(parsed.groupCode ?? transactions[0]?.GROUPCODE ?? collections[0]?.GROUPCODE) || fallback.groupCode,
    joinDate: text(parsed.joinDate),
    sno: text(parsed.sno),
    goldWeight: weights.length ? weights.reduce((sum, weight) => sum + weight, 0) : undefined,
    goldRate: numeric(transactions[0]?.RATE),
    receiptNo: text(transactions[0]?.RECEIPTNO ?? collections[0]?.RECEIPTNO),
    installment: text(transactions[0]?.INSTALLMENT ?? parsed.totalIns),
  };
}
