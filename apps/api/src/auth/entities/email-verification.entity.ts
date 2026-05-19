import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column()
  email: string;

  /** 6-digit numeric code, stored as string to preserve leading zeros */
  @Column({ length: 6 })
  code: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
