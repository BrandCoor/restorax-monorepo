import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { QrMenuService } from './qr-menu.service';

@Controller('qr-menu')
export class QrMenuController {
  constructor(private readonly qrMenuService: QrMenuService) {}

  @Public()
  @Get('table/:tableId')
  getTableMenu(@Param('tableId') tableId: string) {
    return this.qrMenuService.getTableMenu(tableId);
  }

  @Public()
  @Post('order/:tableId')
  placeOrder(
    @Param('tableId') tableId: string,
    @Body()
    body: {
      items: { productId: string; quantity: number; options?: { optionValueId: string }[] }[];
      note?: string;
    },
  ) {
    return this.qrMenuService.placeOrder(tableId, body.items, body.note);
  }

  @Post('generate/:tableId')
  generateQr(
    @Param('tableId') tableId: string,
    @Query('baseUrl') baseUrl: string,
  ) {
    return this.qrMenuService.generateQrPayload(
      tableId,
      baseUrl || 'http://localhost:3001',
    );
  }
}
