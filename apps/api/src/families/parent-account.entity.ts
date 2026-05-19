import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity('parent_accounts')
export class ParentAccount {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true })       email: string;
  @Column()                       passwordHash: string;
  @Column({ nullable: true })     fcmToken?: string;
  @ManyToOne(() => Family, f => f.parentAccounts, { onDelete: 'CASCADE' }) family: Family;
  @CreateDateColumn()             createdAt: Date;
}
