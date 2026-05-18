import { Module }          from '@nestjs/common';
import { JwtModule }       from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule }   from '@nestjs/typeorm';
import { AuthController }  from './auth.controller';
import { AuthService }     from './auth.service';
import { Family }          from '../families/family.entity';
import { Child }           from '../children/child.entity';
import { PinAttempt }      from '../children/pin-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family, Child, PinAttempt]),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_SECRET'), signOptions: { expiresIn: c.get('JWT_EXPIRES_IN') } }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService],
  exports:     [AuthService, JwtModule],
})
export class AuthModule {}
