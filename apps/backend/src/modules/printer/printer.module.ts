import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrinterService } from './printer.service';
import { PrinterController } from './printer.controller';
import { Printer } from './entities/printer.entity';
import { PrinterRule } from './entities/printer-rule.entity';
import { PrintJob } from './entities/print-job.entity';
import { PrintLog } from './entities/print-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrinterRule, PrintJob, PrintLog]),
  ],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [TypeOrmModule],
})
export class PrinterModule {}
