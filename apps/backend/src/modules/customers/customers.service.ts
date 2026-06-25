import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  create(createCustomerDto: CreateCustomerDto) {
    return {
      message: 'This action adds a new customer',
      data: createCustomerDto,
    };
  }

  findAll() {
    return `This action returns all customers`;
  }

  findOne(id: string) {
    return `This action returns a #${id} customer`;
  }

  update(id: string, updateCustomerDto: UpdateCustomerDto) {
    return {
      message: `This action updates a #${id} customer`,
      id,
      data: updateCustomerDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} customer`;
  }
}
