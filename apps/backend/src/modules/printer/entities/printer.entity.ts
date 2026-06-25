import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';
import { PrinterRule } from './printer-rule.entity';

@Entity('printers')
export class Printer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ length: 100 })
  name: string; // "Lahmacun Fırını", "Bar", "Kasa"

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ default: 9100 })
  port: number;

  @Column({ name: 'connection_type', length: 50, default: 'TCP' })
  connectionType: string; // 'TCP', 'USB', 'BLUETOOTH'

  @Column({ length: 100, nullable: true })
  department?: string; // 'KITCHEN', 'BAR', 'CASHIER'

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PrinterRule, (rule: PrinterRule) => rule.printer)
  rules: PrinterRule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
