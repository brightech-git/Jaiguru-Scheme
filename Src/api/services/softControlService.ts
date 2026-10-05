import { callApi } from '../apiClient';
import { SOFT_CONTROL } from '../endpoints';

export interface SoftControlItem {
  ctlId: string;
  ctlName?: string;
  ctlType?: string;
  ctlText?: string | number | null;
  colid?: number;
  Updated?: string;
}

type SoftControlResponse = SoftControlItem[] | { data?: SoftControlItem[] };

/** Missing or invalid controls keep the safer, full-KYC flow. */
export const requiresKycFromControls = (controls: SoftControlItem[]): boolean => {
  const kycControl = controls.find((item) => item.ctlId?.toUpperCase() === 'KYCUPDATION');
  const controlValue = Number(kycControl?.ctlText);
  return !Number.isFinite(controlValue) || controlValue <= 1;
};

export const softControlService = {
  /** GET /soft-control/kyc-updation */
  getKycUpdation: async (): Promise<SoftControlItem[]> => {
    const response = await callApi<null, SoftControlResponse>({
      method: 'get',
      url: SOFT_CONTROL.KYC_UPDATION,
    });

    return Array.isArray(response) ? response : response?.data || [];
  },
};
