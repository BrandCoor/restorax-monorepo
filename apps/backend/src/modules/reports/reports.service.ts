import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getSummary(branchId: string, from?: string, to?: string) {
    const start = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = to ? new Date(to) : new Date(new Date().setHours(23, 59, 59, 999));

    const completedOrders = await this.orderRepository.find({
      where: {
        branchId,
        status: 'COMPLETED',
        createdAt: Between(start, end),
      },
    });

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount) - Number(o.discount),
      0,
    );

    const payments = await this.paymentRepository
      .createQueryBuilder('p')
      .innerJoin('p.order', 'o')
      .where('o.branch_id = :branchId', { branchId })
      .andWhere('o.created_at BETWEEN :start AND :end', { start, end })
      .getMany();

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
    }

    const activeOrders = await this.orderRepository.count({
      where: { branchId, status: 'RECEIVED' },
    });

    return {
      period: { from: start, to: end },
      orderCount: completedOrders.length,
      totalRevenue,
      averageTicket: completedOrders.length
        ? totalRevenue / completedOrders.length
        : 0,
      paymentsByMethod: byMethod,
      activeOrders,
    };
  }

  async getTopProducts(branchId: string, limit = 10) {
    const rows = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .select('p.name', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalQty')
      .addSelect('SUM(oi.subtotal)', 'totalRevenue')
      .where('o.branch_id = :branchId', { branchId })
      .andWhere("o.status = 'COMPLETED'")
      .groupBy('p.name')
      .orderBy('totalQty', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r) => ({
      productName: r.productName,
      totalQty: Number(r.totalQty),
      totalRevenue: Number(r.totalRevenue),
    }));
  }

  async getWaiterPerformance(branchId: string) {
    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .leftJoin('o.waiter', 'w')
      .select("CONCAT(w.first_name, ' ', w.last_name)", 'waiterName')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.total_amount - o.discount)', 'totalRevenue')
      .where('o.branch_id = :branchId', { branchId })
      .andWhere("o.status = 'COMPLETED'")
      .andWhere('o.waiter_id IS NOT NULL')
      .groupBy('w.first_name')
      .addGroupBy('w.last_name')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      waiterName: r.waiterName || 'Bilinmiyor',
      orderCount: Number(r.orderCount),
      totalRevenue: Number(r.totalRevenue),
    }));
  }
}
