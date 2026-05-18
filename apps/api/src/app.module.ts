import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule }         from './auth/auth.module';
import { FamiliesModule }     from './families/families.module';
import { ChildrenModule }     from './children/children.module';
import { TasksModule }        from './tasks/tasks.module';
import { RewardsModule }      from './rewards/rewards.module';
import { TransactionsModule } from './transactions/transactions.module';
import { NotificationsModule }from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        type:        'postgres',
        url:          config.get<string>('DATABASE_URL'),
        entities:    [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:  config.get<string>('NODE_ENV') === 'development',
        logging:      false,
      }),
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
