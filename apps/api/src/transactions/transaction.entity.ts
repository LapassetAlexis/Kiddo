import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Child } from '../children/child.entity';

export type TransactionType     = 'earn' | 'spend';
export type TransactionCurrency = 'xp' | 'gold';

// Immutable ledger — never update, only insert
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       type: TransactionType;
  @Column()                       amount: number;
  @Column({ default: 'gold' })    currency: TransactionCurrency;
  @Column({ nullable: true })     referenceId: string;
  @Column({ nullable: true })     note: string;
  @ManyToOne(() => Child, c => c.transactions, { onDelete: 'CASCADE' }) child: Child;
  @CreateDateColumn()             createdAt: Date;
}
