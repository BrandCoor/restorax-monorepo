import { Injectable } from '@nestjs/common';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  create(createStockDto: CreateStockDto) {
    return {
      message: 'This action adds a new stock item',
      data: createStockDto,
    };
  }

  findAll() {
    return `This action returns all stock`;
  }

  findOne(id: string) {
    return `This action returns a #${id} stock item`;
  }

  update(id: string, updateStockDto: UpdateStockDto) {
    return {
      message: `This action updates a #${id} stock item`,
      id,
      data: updateStockDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} stock item`;
  }
}
