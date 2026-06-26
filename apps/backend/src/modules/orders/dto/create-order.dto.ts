import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemOptionDto {
  @IsUUID()
  @IsNotEmpty()
  optionValueId!: string;
}

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemOptionDto)
  options?: CreateOrderItemOptionDto[];
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  waiterId?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(['TABLE', 'DELIVERY', 'TAKEAWAY'])
  orderType!: 'TABLE' | 'DELIVERY' | 'TAKEAWAY';

  @IsInt()
  @IsOptional()
  @Min(1)
  guestCount?: number;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}