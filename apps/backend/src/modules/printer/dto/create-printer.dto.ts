export class CreatePrinterDto {
  branchId: string;
  name: string;
  ipAddress: string;
  port?: number;
  connectionType?: string;
  department?: string;
  isActive?: boolean;
}
