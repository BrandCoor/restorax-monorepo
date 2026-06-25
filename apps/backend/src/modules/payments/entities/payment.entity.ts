import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'payment_method', length: 50 })
  paymentMethod: string; // 'CASH' (Nakit), 'CREDIT_CARD' (Kart), 'ONLINE' (Online Ödeme), 'OPEN_ACCOUNT' (Açık Hesap/Cari)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
