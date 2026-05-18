import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type NotifStatus = 'pending' | 'sent' | 'failed';

// Outbox pattern: write intent in same TX, worker delivers async
@Entity('notification_intents')
export class NotificationIntent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column()                       fcmToken: string;
  @Column('jsonb')                payload: Record<string, unknown>;
  @Column({ default: 'pending' }) status: NotifStatus;
  @Column({ default: 0 })         attempts: number;
  @CreateDateColumn()             createdAt: Date;
  @Column({ nullable: true })     sentAt: Date;
}
