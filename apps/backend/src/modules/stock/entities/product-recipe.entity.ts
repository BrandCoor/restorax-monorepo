import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from '../../menu/entities/product.entity';
import { Stock } from './stock.entity';

@Entity('product_recipes')
export class ProductRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({
    name: 'consumed_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
  })
  consumedQuantity: number; // Tüketilecek miktar (Örn: 0.150 kg köfte veya 1 adet ekmek)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
