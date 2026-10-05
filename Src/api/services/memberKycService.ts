import { callApi } from '../apiClient';
import { MEMBER } from '../endpoints';

export interface MemberKycStatus {
  PERSONALID?: string | number;
  PNAME?: string;
  MOBILE?: string;
  KYCUPDATION?: 'Y' | 'N' | string;
  UPDATETIME?: string;
}

export interface MemberDetailsPayload {
  doorNo: string;
  address1: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  email: string;
  dob: string;
  maritalStatus: string;
  anniversaryDate: string;
  idProof: string;
  idProofNo: string;
  aadhaarMasked: string;
  nomeni: string;
  nomineeMobile: string;
  nomineeRelationship: string;
}

export const memberKycService = {
  getKycStatus: (personalId: string | number) =>
    callApi<null, MemberKycStatus>({
      method: 'get',
      url: MEMBER.KYC_STATUS(personalId),
    }),

  updateDetails: (personalId: string | number, payload: MemberDetailsPayload) =>
    callApi<MemberDetailsPayload, unknown>({
      method: 'put',
      url: MEMBER.DETAILS(personalId),
      data: payload,
    }),
};
