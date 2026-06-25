import { Injectable } from '@nestjs/common';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Injectable()
export class PrinterService {
  create(createPrinterDto: CreatePrinterDto) {
    return {
      message: 'This action adds a new printer',
      data: createPrinterDto,
    };
  }

  findAll() {
    return `This action returns all printer`;
  }

  findOne(id: string) {
    return `This action returns a #${id} printer`;
  }

  update(id: string, updatePrinterDto: UpdatePrinterDto) {
    return {
      message: `This action updates a #${id} printer`,
      id,
      data: updatePrinterDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} printer`;
  }
}
