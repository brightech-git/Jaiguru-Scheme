// Src/types/Account/Account.ts
//
// Shape of a member's scheme account, as returned by
// GET /account/phone_details and consumed by SchemePassbook.js /
// SchemeDetailsCard.js / SchemeJoinScreen flows. This is the richest,
// most-nested response in the app — kept close to the raw field names so
// existing screens can be migrated incrementally without a data-mapping
// layer in between.

export interface TransBalance {
  amtrecd?: string;
  insPaid?: string;
}

export interface SchemeSummary {
  fixedIns?: string;
  weightLedger?: string;
  schemeId?: number;
  schemeName?: string;
  schemeSName?: string;
  instalment?: string;
  schemaSummaryTransBalance?: TransBalance;
  totalWeight?: string;
  lastWeight?: string;
}

export interface PersonalInfo {
  maskedAadhaar?: string;
  personalId?: number;
  doorNo?: string;
  address1?: string;
  address2?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  mobile?: string;
  mobile2?: string;
  aadhaarNo?: string;
}

export interface SchemeClosedSummary {
  doClose?: string;
  closeDate?: string;
}

export interface PaymentHistoryItem {
  receiptNo?: string | number;
  rate?: string | number;
  amount?: number;
  weight?: string;
  installment?: number;
  updateTime?: string;
  chqBank?: string;
}

export interface Account {
  maskedAadhaar?: string;
  kycVerified?: boolean | string;
  aadhaarVerified?: boolean | string;
  regNo: number;
  groupCode: string;
  amount?: number;
  pName?: string;
  joinDate?: string;
  maturityDate?: string;
  totalAmount?: number;
  schemeSummary?: SchemeSummary;
  personalInfo?: PersonalInfo;
  nextDueDate?: string;
  lastPaidDate?: string;
  remainingDays?: number;
  paymentHistoryList?: PaymentHistoryItem[];
  remainingDueDates?: string[];
  schemeClosedSummary?: SchemeClosedSummary;
  aadhaarKyc?: string | boolean;
  addressKyc?: string | boolean;
}

export type AccountListResponse = Account[];
