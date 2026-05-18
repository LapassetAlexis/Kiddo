import { Module }          from '@nestjs/common';
import { TypeOrmModule }   from '@nestjs/typeorm';
import { Task }            from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService }    from './tasks.service';
import { Transaction }     from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child }           from '../children/child.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([Task, Transaction, NotificationIntent, Child])],
  controllers: [TasksController],
  providers:   [TasksService],
})
export class TasksModule {}
