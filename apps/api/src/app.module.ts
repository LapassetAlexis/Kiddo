import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule }          from './auth/auth.module';
import { FamiliesModule }      from './families/families.module';
import { ChildrenModule }      from './children/children.module';
import { TasksModule }         from './tasks/tasks.module';
import { RewardsModule }       from './rewards/rewards.module';
import { TransactionsModule }  from './transactions/transactions.module';
import { NotificationsModule } from './notifications/notifications.module';

// Entities
import { Family }               from './families/family.entity';
import { ParentAccount }        from './families/parent-account.entity';
import { Child }                from './children/child.entity';
import { PinAttempt }           from './children/pin-attempt.entity';
import { Task }                 from './tasks/task.entity';
import { Reward }               from './rewards/reward.entity';
import { Transaction }          from './transactions/transaction.entity';
import { NotificationIntent }   from './notifications/notification-intent.entity';
import { EmailVerification }    from './auth/entities/email-verification.entity';
import { PasswordReset }        from './auth/entities/password-reset.entity';

const entities = [
  Family, ParentAccount, Child, PinAttempt,
  Task, Reward, Transaction,
  NotificationIntent,
  EmailVerification, PasswordReset,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'development';
        return {
          type:           'postgres',
          url:             config.get<string>('DATABASE_URL'),
          entities,
          synchronize:     isDev,
          logging:         isDev,
          migrations:      [join(__dirname, 'migrations', '*.js')],
          migrationsRun:   !isDev,
        };
      },
    }),
    AuthModule,
    FamiliesModule,
    ChildrenModule,
    TasksModule,
    RewardsModule,
    TransactionsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
