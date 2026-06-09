import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity('parent_accounts')
export class ParentAccount {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true })       email: string;
  @Column({ nullable: true })     passwordHash?: string;
  @Column({ nullable: true, unique: true }) googleId?: string;
  @Column({ nullable: true })     name?: string;
  @Column({ nullable: true })     fcmToken?: string;
  @Column({ default: true })      notifTaskSubmitted: boolean;
  @Column({ default: true })      notifRewardClaimed: boolean;
  @Column({ default: false })     notifStreakAlert: boolean;
  @Column({ nullable: true })     familyId?: string;
  @ManyToOne(() => Family, f => f.parentAccounts, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'familyId' }) family: Family;
  @CreateDateColumn()             createdAt: Date;
}
