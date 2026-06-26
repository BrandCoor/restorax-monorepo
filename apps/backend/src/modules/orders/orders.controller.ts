import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('active-by-table/:tableId')
  findActiveByTable(@Param('tableId') tableId: string) {
    return this.ordersService.findActiveByTable(tableId);
  }

  @Post(':id/print-bill')
  printBill(@Param('id') id: string) {
    return this.ordersService.printBill(id);
  }

  // 1. Yeni Endpoint: Komple Masa Taşıma veya Birleştirme [1]
  @Post('move-table')
  moveTable(
    @Body('sourceTableId') sourceTableId: string,
    @Body('targetTableId') targetTableId: string,
  ) {
    return this.ordersService.moveTable(sourceTableId, targetTableId);
  }

  // 2. Yeni Endpoint: Adisyon/Ürün Ayırma ve Farklı Masaya Aktarma [1]
  @Post('split-table')
  splitTable(
    @Body('sourceOrderId') sourceOrderId: string,
    @Body('targetTableId') targetTableId: string,
    @Body('items') items: { orderItemId: string; quantity: number }[],
  ) {
    return this.ordersService.splitTable(sourceOrderId, targetTableId, items);
  }

  @Post(':id/discount')
  applyDiscount(
    @Param('id') id: string,
    @Body('discountType') discountType: 'AMOUNT' | 'PERCENT',
    @Body('value') value: number,
  ) {
    return this.ordersService.applyDiscount(id, discountType, value);
  }

  @Post(':id/pay-amount')
  payCustomAmount(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('amount') amount: number,
  ) {
    return this.ordersService.payCustomAmount(id, paymentMethod, amount);
  }

  @Post(':id/pay-items')
  payItems(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('items') items: { orderItemId: string; quantity: number }[],
  ) {
    return this.ordersService.payItems(id, paymentMethod, items);
  }

  @Post(':id/settle')
  settleOrder(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('amount') amount: number,
  ) {
    return this.ordersService.settleOrder(id, paymentMethod, amount);
  }

  @Post('test-platform')
  createTestPlatform(
    @Body('branchId') branchId: string,
    @Body('platformName') platformName: string,
  ) {
    return this.ordersService.createTestPlatformOrder(branchId, platformName);
  }

  @Post('test')
  createTest(@Body('branchId') branchId: string) {
    return this.ordersService.createTestOrder(branchId);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    if (branchId) {
      return this.ordersService.findAllActiveByBranch(branchId);
    }
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}