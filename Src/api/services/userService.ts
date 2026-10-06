// Src/api/services/userService.ts
import { callApi } from '../apiClient';
import { USER } from '../endpoints';

export interface UserKycDetails {
  maskedAadhaar?: string;
  id: number | string;
  aadhaarVerified?: boolean;
  kycVerified?: boolean;
}

export const userService = {
  getDetails: (userId: string | number) =>
    callApi<null, UserKycDetails>({ method: 'get', url: USER.DETAILS(userId) }),
  /** DELETE /user/delete/:userId */
  deleteAccount: (userId: string | number) =>
    callApi<null, { message?: string }>({
      method: 'delete',
      url: USER.DELETE(userId),
    }),
};
