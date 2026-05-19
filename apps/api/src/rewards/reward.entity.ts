import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Family } from '../families/family.entity';

export type RewardAvailability = 'unlimited' | 'once';
export type RewardStatus       = 'available' | 'claimed' | 'granted';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       title: string;
  @Column({ nullable: true })     description: string;
  @Column({ nullable: true })     emoji: string;
  @Column()                       cost: number;
  @Column({ default: 'unlimited' }) availability: RewardAvailability;
  @Column({ default: 'available' }) status: RewardStatus;
  @Column({ nullable: true, type: 'varchar', default: null }) claimedByChildId: string | null;
  @Column({ nullable: true }) grantedByName: string;
  @ManyToOne(() => Family, { onDelete: 'CASCADE' }) family: Family;
  @CreateDateColumn() createdAt: Date;
}
