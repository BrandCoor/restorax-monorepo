export class CreateIntegrationDto {
  branchId: string;
  platformName: string;
  apiKey: string;
  apiSecret?: string;
  isActive?: boolean;
}
