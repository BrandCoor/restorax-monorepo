import { Injectable } from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  create(createTableDto: CreateTableDto) {
    return {
      message: 'This action adds a new table',
      data: createTableDto,
    };
  }

  findAll() {
    return `This action returns all tables`;
  }

  findOne(id: string) {
    return `This action returns a #${id} table`;
  }

  update(id: string, updateTableDto: UpdateTableDto) {
    return {
      message: `This action updates a #${id} table`,
      id,
      data: updateTableDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} table`;
  }
}
