import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity('parent_accounts')
export class ParentAccount {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true })       email: string;
  @Column()                       passwordHash: string;
  @Column({ nullable: true })     name?: string;
  @Column({ nullable: true })     fcmToken?: string;
  @Column({ default: true })      notifTaskSubmitted: boolean;
  @Column({ default: true })      notifRewardClaimed: boolean;
  @Column({ default: false })     notifStreakAlert: boolean;
  @ManyToOne(() => Family, f => f.parentAccounts, { onDelete: 'CASCADE' }) family: Family;
  @CreateDateColumn()             createdAt: Date;
}
