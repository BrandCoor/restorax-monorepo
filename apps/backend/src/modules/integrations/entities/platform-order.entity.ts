import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('platform_orders')
export class PlatformOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'platform_name', length: 100 })
  platformName: string; // 'TRENDYOL', 'YEMEKSEPETI', 'GETIR', 'MIGROS'

  @Column({ name: 'external_order_id', length: 100 })
  externalOrderId: string; // Dış platformun kendi ürettiği sipariş ID'si

  @Column({ name: 'customer_delivery_address', type: 'text', nullable: true })
  customerDeliveryAddress?: string; // Teslimat adresi [2.1]

  @Column({ name: 'customer_phone', length: 50, nullable: true })
  customerPhone?: string;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: any; // Gelen ham JSON verisinin tamamı (log ve denetim takibi için)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
