// Src/api/services/userService.ts
import { callApi } from '../apiClient';
import { USER } from '../endpoints';

export interface UserKycDetails {
  maskedAadhaar?: string;
  id: number | string;
  aadhaarVerified?: boolean;
  kycVerified?: boolean;
  username?: string;
  email?: string;
  contactNumber?: string;
  walletBalance?: number;
  referralCode?: string;
  gender?: string;
  dateOfBirth?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  termsAccepted?: boolean;
  photoPath?: string | null;
  user_image?: string | null;
}

export const userService = {
  updatePhoto: (userId: string | number, photo: { uri: string; name: string; type: string; file?: File }) => {
    const data = new FormData();
    if (photo.file) data.append('photo', photo.file, photo.name);
    else data.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
    return callApi<FormData, { photoPath: string }>({ method: 'put', url: USER.PHOTO(userId), data, isFormData: true });
  },
  deletePhoto: (userId: string | number) =>
    callApi<null, { message?: string }>({ method: 'delete', url: USER.PHOTO(userId) }),
  getDetails: (userId: string | number) =>
    callApi<null, UserKycDetails>({ method: 'get', url: USER.DETAILS(userId) }),
  /** DELETE /user/delete/:userId */
  deleteAccount: (userId: string | number) =>
    callApi<null, { message?: string }>({
      method: 'delete',
      url: USER.DELETE(userId),
    }),
};
