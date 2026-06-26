import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../menu/entities/product.entity';
import { OrderItemOption } from './order-item-option.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @ManyToOne(() => Order, (order: Order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'paid_quantity', default: 0 })
  paidQuantity: number; // Ürün bazlı parçalı ödemede tahsil edilen miktar [1.5.1]

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ length: 50, default: 'PENDING' })
  status: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @OneToMany(() => OrderItemOption, (option: OrderItemOption) => option.orderItem)
  options: OrderItemOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}