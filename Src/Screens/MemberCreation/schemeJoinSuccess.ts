export interface SchemeJoinSuccessDetails {
  userName: string;
  schemeName: string;
  amount: number;
  personalId?: string;
  regNo?: string;
  groupCode?: string;
  joinDate?: string;
  sno?: string;
}

export function buildSchemeJoinSuccess(
  processResult: string | undefined,
  fallback: { userName: string; schemeName?: string; amount: number | null; groupCode?: string },
): SchemeJoinSuccessDetails {
  const parsed: Record<string, string> = {};
  for (const pair of (processResult || '').replace(/^PROCESSED:\s*/, '').replace(/[{}]/g, '').split(/,\s*/)) {
    const separator = pair.indexOf('=');
    if (separator > 0) {
      const value = pair.slice(separator + 1).trim();
      if (value && value !== 'null') parsed[pair.slice(0, separator).trim()] = value;
    }
  }
  const amount = Number(parsed.amount);
  return {
    userName: fallback.userName.trim() || 'Member',
    schemeName: fallback.schemeName || 'Jewellery savings scheme',
    amount: parsed.amount && Number.isFinite(amount) && amount > 0 ? amount : fallback.amount || 0,
    personalId: parsed.personalId,
    regNo: parsed.regNo,
    groupCode: parsed.groupCode || fallback.groupCode,
    joinDate: parsed.joinDate,
    sno: parsed.sno,
  };
}
