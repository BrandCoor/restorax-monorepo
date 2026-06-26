import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  status?: string;
  rejectReason?: string; // Reddedilme nedeni parametresi [1]
}