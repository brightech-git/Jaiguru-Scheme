// Src/api/services/employeeService.ts
import { callApi } from '../apiClient';
import { EMPLOYEES } from '../endpoints';
import { EmployeeListResponse } from '../../types/Employee/Employee';

export const employeeService = {
  /** GET /employees?empId= — an empty empId returns every employee */
  search: (empId: string = '') =>
    callApi<null, EmployeeListResponse>({
      method: 'get',
      url: EMPLOYEES.SEARCH(empId),
    }),
};
