import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Child } from '../children/child.entity';

export type TaskFrequency = 'once' | 'daily' | 'weekly';
export type TaskStatus    = 'created' | 'pending_approval' | 'validated' | 'rejected';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       title: string;
  @Column({ nullable: true })     description: string;
  @Column()                       points: number;
  @Column({ default: 'daily' })   frequency: TaskFrequency;
  @Column({ default: 'created' }) status: TaskStatus;
  @Column({ type: 'text', nullable: true }) photoUrl: string;
  @Column({ nullable: true })     note: string;
  @Column({ nullable: true })     rejectionReason: string;
  @ManyToOne(() => Child, c => c.tasks, { onDelete: 'CASCADE' }) child: Child;
  @CreateDateColumn()             createdAt: Date;
  @UpdateDateColumn()             updatedAt: Date;
  @Column({ nullable: true })     submittedAt: Date;
  @Column({ nullable: true })     validatedAt: Date;
  @Column({ nullable: true })     approvedByName: string;
}
