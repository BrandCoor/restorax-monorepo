import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';
import { Table } from './table.entity';

@Entity('table_sections')
export class TableSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // "Salon", "Bahçe", "VIP"

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Table, (table) => table.section)
  tables: Table[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
