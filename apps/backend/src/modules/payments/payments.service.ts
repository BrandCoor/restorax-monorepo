import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(private readonly dataSource: DataSource) {}

  // Şubenin bugünkü toplam ciro tutarını hesaplar (Zaman dilimi güvenlidir) [1]
  async getTodayTotal(branchId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Bugünün başlangıcı (00:00:00)

    const result = await this.dataSource.manager
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .innerJoin('payment.order', 'order')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('payment.createdAt >= :todayStart', { todayStart })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return {
      total: Number(result?.total || 0.0),
    };
  }

  create(createPaymentDto: CreatePaymentDto) {
    return {
      message: 'This action adds a new payment',
      data: createPaymentDto,
    };
  }

  async findAll() {
    return this.dataSource.manager.find(Payment);
  }

  async findOne(id: string) {
    return this.dataSource.manager.findOne(Payment, { where: { id } });
  }

  update(id: string, _updatePaymentDto: UpdatePaymentDto) {
    return {
      message: `This action updates a #${id} payment`,
    };
  }

  remove(id: string) {
    return { deleted: true, id };
  }
}