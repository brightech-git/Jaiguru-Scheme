// Src/types/Employee/Employee.ts
//
// Shape returned by GET /employees?empId=.

export interface Employee {
  EMPID: number;
  EMPNAME: string;
  DATEOFJOIN: string | null;
  ADDRESS1: string;
  ADDRESS2: string;
  ADDRESS3: string;
  ADDRESS4: string;
  ACTIVE: 'Y' | 'N' | string;
  USERID: number | null;
  UPDATETIME: string | null;
  COSTID: string;
  PREVILEGEID: string;
  EMPGRPID: number | null;
  CENTEMP: number | null;
}

export type EmployeeListResponse = Employee[];
