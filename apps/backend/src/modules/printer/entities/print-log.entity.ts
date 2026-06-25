import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PrintJob } from './print-job.entity';

@Entity('print_logs')
export class PrintLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PrintJob, (job: PrintJob) => job.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'print_job_id' })
  printJob: PrintJob;

  @Column({ length: 50 })
  status: string; // 'SUCCESS', 'FAILED'

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string; // [2.1]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
