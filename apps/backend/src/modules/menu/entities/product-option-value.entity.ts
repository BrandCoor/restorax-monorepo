import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProductOption } from './product-option.entity';

@Entity('product_option_values')
export class ProductOptionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // "Büyük Boy", "Ekstra Peynir"

  @Column({
    name: 'price_impact',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  priceImpact: number; // Seçildiğinde fiyata eklenecek ekstra tutar (+15.00 TL vb.)

  @ManyToOne(() => ProductOption, (option) => option.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_id' })
  option: ProductOption;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
