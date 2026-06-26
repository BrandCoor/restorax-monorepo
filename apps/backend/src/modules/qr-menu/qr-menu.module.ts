import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrMenuService } from './qr-menu.service';
import { QrMenuController } from './qr-menu.controller';
import { Table } from '../tables/entities/table.entity';
import { TableSection } from '../tables/entities/table-section.entity';
import { Branch } from '../restaurants/entities/branch.entity';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, TableSection, Branch]),
    MenuModule,
    OrdersModule,
  ],
  controllers: [QrMenuController],
  providers: [QrMenuService],
})
export class QrMenuModule {}
