import { callApi } from '../apiClient';
import { BRANCHES } from '../endpoints';

export interface Branch {
  companyId: string;
  companyName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  address4?: string;
  areaCode?: string;
  phone?: string;
  email?: string;
  displayOrder?: number;
  active?: string;
}

export const branchService = {
  getAll: () => callApi<null, Branch[]>({ method: 'get', url: BRANCHES.ALL }),
};
