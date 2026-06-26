import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../tables/entities/table.entity';
import { TableSection } from '../tables/entities/table-section.entity';
import { Branch } from '../restaurants/entities/branch.entity';
import { MenuService } from '../menu/menu.service';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class QrMenuService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableSection)
    private readonly sectionRepository: Repository<TableSection>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly menuService: MenuService,
    private readonly ordersService: OrdersService,
  ) {}

  async getTableMenu(tableId: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId, isActive: true },
      relations: { section: { branch: { restaurant: true } } },
    });
    if (!table) throw new NotFoundException('Masa bulunamadı.');

    const branchId = table.section.branch.id;
    const menu = await this.menuService.findAllByBranch(branchId);

    return {
      table: {
        id: table.id,
        name: table.name,
        status: table.status,
        capacity: table.capacity,
      },
      branch: {
        id: branchId,
        name: table.section.branch.name,
        address: table.section.branch.address,
      },
      restaurant: {
        id: table.section.branch.restaurant.id,
        name: table.section.branch.restaurant.name,
        logoUrl: table.section.branch.restaurant.logoUrl,
      },
      menu,
    };
  }

  async placeOrder(tableId: string, items: CreateOrderDto['items'], note?: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: { section: { branch: true } },
    });
    if (!table) throw new NotFoundException('Masa bulunamadı.');

    const dto: CreateOrderDto = {
      branchId: table.section.branch.id,
      orderType: 'TABLE',
      tableId: table.id,
      source: 'QR_MENU',
      note,
      items,
    };

    const order = await this.ordersService.create(dto);
    return order;
  }

  async generateQrPayload(tableId: string, baseUrl: string) {
    const table = await this.tableRepository.findOne({ where: { id: tableId } });
    if (!table) throw new NotFoundException('Masa bulunamadı.');

    const qrUrl = `${baseUrl}/qr/${tableId}`;
    table.qrCodePayload = qrUrl;
    await this.tableRepository.save(table);
    return { tableId, qrUrl };
  }
}
