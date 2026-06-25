import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';
import { Printer } from './printer.entity';
import { Category } from '../../menu/entities/category.entity';
import { Product } from '../../menu/entities/product.entity';

@Entity('printer_rules')
export class PrinterRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Printer, (printer: Printer) => printer.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'printer_id' })
  printer: Printer;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
