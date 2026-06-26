import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PrinterService } from './printer.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post()
  create(@Body() createPrinterDto: CreatePrinterDto) {
    return this.printerService.create(createPrinterDto);
  }

  @Post('rules')
  saveRule(
    @Body()
    body: {
      branchId: string;
      printerId: string;
      categoryId?: string;
      productId?: string;
    },
  ) {
    return this.printerService.saveRule(body);
  }

  @Get('jobs/pending')
  findPendingJobs(@Query('branchId') branchId: string) {
    return this.printerService.findPendingJobs(branchId);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.printerService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.printerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePrinterDto: UpdatePrinterDto) {
    return this.printerService.update(id, updatePrinterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.printerService.remove(id);
  }
}
