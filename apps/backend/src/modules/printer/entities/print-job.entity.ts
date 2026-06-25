import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../restaurants/entities/branch.entity';
import { Printer } from './printer.entity';
import { PrintLog } from './print-log.entity';

@Entity('print_jobs')
export class PrintJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Printer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'printer_id' })
  printer: Printer;

  @Column({ type: 'text' })
  payload: string; // ESC/POS ham verisi veya şablon JSON'ı [2.1]

  @Column({ length: 50, default: 'PENDING' })
  status: string; // 'PENDING', 'SENT', 'FAILED'

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @OneToMany(() => PrintLog, (log: PrintLog) => log.printJob)
  logs: PrintLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
