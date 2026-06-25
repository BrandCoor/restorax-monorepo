import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';

@Entity('stock')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'ingredient_name', length: 255 })
  ingredientName: string; // "Dana Köfte", "Burger Ekmeği", "Kola Kutusu"

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0.0 })
  quantity: number; // 15.500 kg, 200 adet vb.

  @Column({ length: 50 })
  unit: string; // 'KG', 'PIECE' (Adet), 'LITER'

  @Column({
    name: 'min_stock_level',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  minStockLevel?: number; // Kritik seviye uyarısı için (örn: patates 5 kg altına düşerse uyar)

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
