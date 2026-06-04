import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('qr_tokens')
export class QrToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       tokenHash: string;
  @Column()                       childId: string;
  @Column()                       expiresAt: Date;
  @Column({ nullable: true })     usedAt: Date;
  @CreateDateColumn()             createdAt: Date;
}
