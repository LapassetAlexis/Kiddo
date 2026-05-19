import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Child } from '../children/child.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true })       email: string;
  @Column()                       passwordHash: string;
  @Column({ nullable: true })     name: string;
  @Column({ default: 'Europe/Paris' }) timezone: string;
  @OneToMany(() => Child, c => c.family) children: Child[];
  @CreateDateColumn()             createdAt: Date;
}
