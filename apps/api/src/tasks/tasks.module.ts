import { Module }          from '@nestjs/common';
import { TypeOrmModule }   from '@nestjs/typeorm';
import { Task }            from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService }    from './tasks.service';
import { Transaction }     from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child }           from '../children/child.entity';
import { FamiliesModule }  from '../families/families.module';
import { AuthModule }      from '../auth/auth.module';

@Module({
  imports:     [TypeOrmModule.forFeature([Task, Transaction, NotificationIntent, Child]), FamiliesModule, AuthModule],
  controllers: [TasksController],
  providers:   [TasksService],
  exports:     [TasksService, TypeOrmModule],
})
export class TasksModule {}
