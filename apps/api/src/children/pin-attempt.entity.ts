import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Child } from './child.entity';

// Stored in DB so lockout survives server restart (not in-memory)
@Entity('pin_attempts')
export class PinAttempt {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Child, { onDelete: 'CASCADE' }) child: Child;
  @Column({ default: 0 })         attemptCount: number;
  @Column({ nullable: true })     lockedUntil: Date;
  @CreateDateColumn()             updatedAt: Date;
}
