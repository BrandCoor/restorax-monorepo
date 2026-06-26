import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(
    @Query('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSummary(branchId, from, to);
  }

  @Get('top-products')
  getTopProducts(
    @Query('branchId') branchId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts(branchId, limit ? Number(limit) : 10);
  }

  @Get('waiter-performance')
  getWaiterPerformance(@Query('branchId') branchId: string) {
    return this.reportsService.getWaiterPerformance(branchId);
  }
}
