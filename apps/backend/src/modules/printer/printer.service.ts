import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterRule } from './entities/printer-rule.entity';
import { PrintJob } from './entities/print-job.entity';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Injectable()
export class PrinterService {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterRule)
    private readonly ruleRepository: Repository<PrinterRule>,
    @InjectRepository(PrintJob)
    private readonly jobRepository: Repository<PrintJob>,
  ) {}

  create(createPrinterDto: CreatePrinterDto) {
    const printer = this.printerRepository.create(createPrinterDto);
    return this.printerRepository.save(printer);
  }

  findAll(branchId?: string) {
    if (branchId) {
      return this.printerRepository.find({
        where: { branchId },
        relations: { rules: true },
      });
    }
    return this.printerRepository.find({ relations: { rules: true } });
  }

  async findOne(id: string) {
    const printer = await this.printerRepository.findOne({
      where: { id },
      relations: { rules: true },
    });
    if (!printer) throw new NotFoundException('Yazıcı bulunamadı.');
    return printer;
  }

  async update(id: string, updatePrinterDto: UpdatePrinterDto) {
    const printer = await this.findOne(id);
    Object.assign(printer, updatePrinterDto);
    return this.printerRepository.save(printer);
  }

  async remove(id: string) {
    await this.printerRepository.delete(id);
    return { deleted: true };
  }

  saveRule(data: {
    branchId: string;
    printerId: string;
    categoryId?: string;
    productId?: string;
  }) {
    const rule = this.ruleRepository.create(data);
    return this.ruleRepository.save(rule);
  }

  findPendingJobs(branchId: string) {
    return this.jobRepository.find({
      where: { branchId, status: 'PENDING' },
      relations: { printer: true },
      order: { createdAt: 'ASC' },
    });
  }
}
