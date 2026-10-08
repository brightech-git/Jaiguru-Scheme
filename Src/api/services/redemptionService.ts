import { callApi } from '../apiClient';
import { REDEMPTION } from '../endpoints';

export interface RedemptionAccount { groupCode: string; regNo: number }
export interface RedemptionEstimate { SlipNo: number; GROUPCODE: string; RegNo: number }
export const redemptionService = {
  getEstimates: (params: RedemptionAccount) =>
    callApi<null, RedemptionEstimate[]>({ method: 'get', url: REDEMPTION.GET_ESTIMATES, params }),
  sendOtp: (data: RedemptionAccount) =>
    callApi<typeof data, { mobile: string; message: string }>({ method: 'post', url: REDEMPTION.SEND_OTP, data }),
  verifyOtp: (data: RedemptionAccount & { otp: number }) =>
    callApi<typeof data, { verified: boolean }>({ method: 'post', url: REDEMPTION.VERIFY_OTP, data }),
};
