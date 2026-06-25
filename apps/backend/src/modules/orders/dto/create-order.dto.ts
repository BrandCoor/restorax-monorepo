export class CreateOrderItemOptionDto {
  optionValueId!: string;
}

export class CreateOrderItemDto {
  productId!: string;
  quantity!: number;
  note?: string;
  options?: CreateOrderItemOptionDto[];
}

export class CreateOrderDto {
  branchId!: string;
  tableId?: string;
  waiterId?: string;
  note?: string;
  items!: CreateOrderItemDto[];
}