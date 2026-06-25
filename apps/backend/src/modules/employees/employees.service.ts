import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  create(createEmployeeDto: CreateEmployeeDto) {
    return {
      message: 'This action adds a new employee',
      data: createEmployeeDto,
    };
  }

  findAll() {
    return `This action returns all employees`;
  }

  findOne(id: string) {
    return `This action returns a #${id} employee`;
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return {
      message: `This action updates a #${id} employee`,
      id,
      data: updateEmployeeDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} employee`;
  }
}
