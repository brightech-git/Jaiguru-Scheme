// Src/types/Member/Member.ts
//
// Shape of the NMDATA payload sent as part of POST /razorpay/create-order
// (NEWJOIN=true), built in Src/Screens/MemberCreation/MemberCreation.tsx.
// There is no longer a standalone /member/create call — the backend parks
// this payload against the Razorpay order and creates the member once
// payment is confirmed (webhook or /verify-payment).

export interface NewMemberPayload {
  title?: string;
  initial?: string;
  pName: string;
  sName?: string;
  doorNo?: string;
  address1?: string;
  address2?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  mobile: string;
  mobile2?: string;
  nomeni?: string;
  nomineeMobile?: string;
  nomineeRelationship?: string;
  nomAddr1?: string;
  nomAddr2?: string;
  nomCity?: string;
  nomState?: string;
  nomPincode?: string;
  nomCountry?: string;
  idProof?: string;
  idProofNo?: string;
  aadhaarMasked?: string;
  /** Maps to the backend NewMember model's "panno" field — do not rename to "panNumber", Jackson will reject it as unrecognized and fail the whole request. */
  panno?: string;
  dob?: string | null;
  email?: string;
  // The backend's NewMember model has no "mobileVerified"/"aadhaarVerified" fields
  // for the primary member (only nomineeMobileVerified/nomineeAadhaarVerified exist,
  // for the nominee) — sending them throws a Jackson UnrecognizedPropertyException
  // that fails the entire member creation. Don't add them back here.
  nomineeMobileVerified?: boolean;
  nomineeAadhaarVerified?: boolean;
  upDateTime?: string;
  userId?: string | number;
  appVer?: string;
  anniversaryDate?: string | null;
}

export interface CreateSchemeSummaryPayload {
  schemeId: number;
  groupCode: string;
  regNo: number;
  joinDate: string;
  /** Maps to the backend CreateSchemeSummary model's "updateTime" field — do not rename to "upDateTime2". */
  updateTime: string;
  openingDate: string;
  /** Maps to the backend CreateSchemeSummary model's "userId" field — do not rename to "userId2". */
  userId?: string | number;
  /** Referring employee id; "999" when no employee was picked. */
  iEmp?: string;
}

export interface SchemeCollectInsertPayload {
  amount: number;
  modePay: number | string;
  accCode: string;
  chqBankCode: number;
  chqCardNo?: string;
  chqBranch?: string;
  chkBank?: string;
  chqRtnReason?: string;
}

export interface CreateMemberPayload {
  newMember: NewMemberPayload;
  createSchemeSummary: CreateSchemeSummaryPayload;
  schemeCollectInsert: SchemeCollectInsertPayload;
  referralCode?: string;
}

export interface CreateMemberResponse {
  message?: string;
  [key: string]: unknown;
}
