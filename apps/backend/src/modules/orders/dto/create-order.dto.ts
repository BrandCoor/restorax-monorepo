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
  tableId?: string; // Masa siparişi ise dolu gelir
  waiterId?: string; // Garson siparişi ise dolu gelir
  note?: string;
  orderType!: 'TABLE' | 'DELIVERY' | 'TAKEAWAY'; 
  
  guestCount?: number; // Masadaki kişi sayısı parametresi [1]
  source?: string;

  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  
  items!: CreateOrderItemDto[];
}