export class CreateStockDto {
  branchId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  minStockLevel?: number;
}
