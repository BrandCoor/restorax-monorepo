import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  create(createPaymentDto: CreatePaymentDto) {
    return {
      message: 'This action adds a new payment',
      data: createPaymentDto,
    };
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: string) {
    return `This action returns a #${id} payment`;
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return {
      message: `This action updates a #${id} payment`,
      id,
      data: updatePaymentDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} payment`;
  }
}
