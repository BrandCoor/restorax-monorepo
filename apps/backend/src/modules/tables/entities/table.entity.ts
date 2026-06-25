import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TableSection } from './table-section.entity';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string; // "Masa 1", "Masa 10", "V1"

  @Column({ default: 4 })
  capacity: number;

  @Column({ name: 'qr_code_payload', type: 'text', nullable: true })
  qrCodePayload?: string;

  @Column({ length: 50, default: 'IDLE' })
  status: string; // 'IDLE', 'ORDERED', 'PREPARING', 'BILL_REQUESTED', 'CLOSED'

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => TableSection, (section) => section.tables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: TableSection;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
