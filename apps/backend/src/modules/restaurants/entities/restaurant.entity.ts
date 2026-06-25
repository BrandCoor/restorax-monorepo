import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 100 })
  subdomain: string; // Örn: "burger-x.restorax.com"

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  // Bir restoranın birden fazla şubesi olabilir (1:N İlişkisi)
  @OneToMany(() => Branch, (branch) => branch.restaurant)
  branches: Branch[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
