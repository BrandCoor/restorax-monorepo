import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';
import { Table } from '../../tables/entities/table.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id', referencedColumnName: 'id' })
  branch: Branch;

  @Column({ name: 'table_id', nullable: true })
  tableId?: string;

  @ManyToOne(() => Table, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'table_id' })
  table?: Table;

  @Column({ name: 'waiter_id', nullable: true })
  waiterId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'waiter_id' })
  waiter?: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  discount: number; // Adisyona uygulanan toplam indirim tutarı

  @Column({ name: 'guest_count', type: 'int', default: 1 })
  guestCount: number; // Masadaki kişi sayısı takibi [1]

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string; // CRM entegrasyonu için şimdilik sade UUID olarak tutuyoruz

  @Column({ length: 50, default: 'WAITER' })
  source: string; // 'WAITER', 'QR_MENU', 'TRENDYOL', 'YEMEKSEPETI', 'GETIR', 'MIGROS'

  @Column({ length: 50, default: 'RECEIVED' })
  status: string; // 'RECEIVED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason?: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @OneToMany(() => OrderItem, (item: OrderItem) => item.order)
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}