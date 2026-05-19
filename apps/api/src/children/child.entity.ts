import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Family }      from '../families/family.entity';
import { Task }        from '../tasks/task.entity';
import { Reward }      from '../rewards/reward.entity';
import { Transaction } from '../transactions/transaction.entity';
import { PinAttempt }  from './pin-attempt.entity';

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       name: string;
  @Column()                             avatar: string; // emoji
  @Column({ default: '#FFB300' })       color: string;
  @Column()                             pinHash: string;
  @Column({ nullable: true })     fcmToken: string;
  @ManyToOne(() => Family, f => f.children, { onDelete: 'CASCADE' }) family: Family;
  @OneToMany(() => Task, t => t.child)         tasks: Task[];
  @OneToMany(() => Reward, r => r.family)      rewards: Reward[];
  @OneToMany(() => Transaction, t => t.child)  transactions: Transaction[];
  @OneToMany(() => PinAttempt, p => p.child)   pinAttempts: PinAttempt[];
  @CreateDateColumn() createdAt: Date;
}
