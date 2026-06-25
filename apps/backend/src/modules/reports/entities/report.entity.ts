import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'report_type', length: 100 })
  reportType: string; // 'DAILY_SALES' (Günlük Satış), 'CATEGORY_PERFORMANCE' (Kategori Satışları), 'WAITER_PERFORMANCE' (Garson Performansları)

  @Column({ type: 'jsonb' })
  data: any; // Önceden hesaplanmış tüm rapor verilerini tutan dinamik nesne (JSONB) [1.5.1]

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}
