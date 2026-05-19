import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Child } from '../children/child.entity';
import { ParentAccount } from './parent-account.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true })     name?: string;
  @Column({ default: 'Europe/Paris' }) timezone: string;
  @Column({ unique: true, nullable: true }) inviteCode?: string;
  @OneToMany(() => Child, c => c.family)           children: Child[];
  @OneToMany(() => ParentAccount, p => p.family)   parentAccounts: ParentAccount[];
  @CreateDateColumn()             createdAt: Date;
}
