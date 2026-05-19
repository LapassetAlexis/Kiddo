import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Child } from './child.entity';
import { PinAttempt } from './pin-attempt.entity';
import { Transaction } from '../transactions/transaction.entity';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';

@Module({
  imports: [TypeOrmModule.forFeature([Child, PinAttempt, Transaction])],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
