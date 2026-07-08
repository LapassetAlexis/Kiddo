import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Family }      from '../families/family.entity';
import { Task }        from '../tasks/task.entity';
import { Reward }      from '../rewards/reward.entity';
import { Transaction } from '../transactions/transaction.entity';
import { PinAttempt }  from './pin-attempt.entity';

export type ChildClass = 'warrior' | 'archer' | 'mage' | 'rogue';

export type AvatarConfig = {
  head?: string;
  hair?: string;
  backhair?: string;
  hat?: string | null;
  top?: string;
  bottom?: string;
  weapon?: string | null;
  shadow?: string;
};

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       name: string;
  @Column()                       avatar: string;
  @Column({ default: '#FFB300' }) color: string;
  @Column({ type: 'varchar', nullable: true })  sprite: string | null;
  @Column()                       pinHash: string;
  @Column({ default: 0 })         xp: number;
  @Column({ default: 'warrior' }) class: ChildClass;
  @Column({ nullable: true })     fcmToken: string;
  @Column({ type: 'int', nullable: true, default: null }) pendingLevelUp: number | null;
  @Column({ type: 'int', nullable: true, default: null }) levelGoal: number | null;
  @Column({ type: 'varchar', nullable: true, default: null }) levelGoalReward: string | null;
  @Column({ type: 'jsonb', nullable: true, default: null }) avatarConfig: AvatarConfig | null;
  @ManyToOne(() => Family, f => f.children, { onDelete: 'CASCADE' }) family: Family;
  @OneToMany(() => Task, t => t.child)         tasks: Task[];
  @OneToMany(() => Reward, r => r.family)      rewards: Reward[];
  @OneToMany(() => Transaction, t => t.child)  transactions: Transaction[];
  @OneToMany(() => PinAttempt, p => p.child)   pinAttempts: PinAttempt[];
  @CreateDateColumn() createdAt: Date;
}
