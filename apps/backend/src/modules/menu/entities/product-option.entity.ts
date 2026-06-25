import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductOptionValue } from './product-option-value.entity';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // "Boyut Seçimi", "Sos Seçimi"

  @Column({ name: 'option_type', length: 50, default: 'SINGLE' })
  optionType: string; // 'SINGLE' (Sadece biri seçilebilir), 'MULTIPLE' (Çoklu seçim yapılabilir)

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @ManyToOne(() => Product, (product) => product.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => ProductOptionValue, (value) => value.option)
  values: ProductOptionValue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
