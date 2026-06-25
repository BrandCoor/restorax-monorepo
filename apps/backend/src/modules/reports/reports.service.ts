import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  create(createReportDto: CreateReportDto) {
    return {
      message: 'This action adds a new report',
      data: createReportDto,
    };
  }

  findAll() {
    return `This action returns all reports`;
  }

  findOne(id: string) {
    return `This action returns a #${id} report`;
  }

  update(id: string, updateReportDto: UpdateReportDto) {
    return {
      message: `This action updates a #${id} report`,
      id,
      data: updateReportDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} report`;
  }
}
