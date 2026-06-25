import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'platform_name', length: 100 })
  platformName: string; // 'TRENDYOL', 'YEMEKSEPETI', 'GETIR', 'MIGROS'

  @Column({ name: 'api_key', type: 'text' })
  apiKey: string; // API Anahtarı [2.1]

  @Column({ name: 'api_secret', type: 'text', nullable: true })
  apiSecret?: string; // API Şifresi [2.1]

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
