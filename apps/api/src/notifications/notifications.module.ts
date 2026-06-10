import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationIntent } from './notification-intent.entity';
import { Child } from '../children/child.entity';
import { Task } from '../tasks/task.entity';
import { Family } from '../families/family.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FamiliesModule } from '../families/families.module';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([NotificationIntent, Child, Task, Family]), FamiliesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
