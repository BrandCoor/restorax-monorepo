import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { ProductOptionValue } from '../../menu/entities/product-option-value.entity';

@Entity('order_item_options')
export class OrderItemOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderItem, (item: OrderItem) => item.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @ManyToOne(() => ProductOptionValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'option_value_id' })
  optionValue: ProductOptionValue;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Seçildiği andaki ekstra opsiyon fiyatı

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
