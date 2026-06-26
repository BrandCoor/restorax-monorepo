export class CreateEmployeeDto {
  branchId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleName?: string;
  salary?: number;
  workingHours?: string;
}
