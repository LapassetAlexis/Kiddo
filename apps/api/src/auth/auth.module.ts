import { Module }          from '@nestjs/common';
import { JwtModule }       from '@nestjs/jwt';
import { PassportModule }  from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule }   from '@nestjs/typeorm';
import { AuthController }      from './auth.controller';
import { AuthService, JwtStrategy } from './auth.service';
import { EmailModule }     from '../email/email.module';
import { Family }              from '../families/family.entity';
import { ParentAccount }       from '../families/parent-account.entity';
import { Child }               from '../children/child.entity';
import { PinAttempt }          from '../children/pin-attempt.entity';
import { EmailVerification }   from './entities/email-verification.entity';
import { PasswordReset }       from './entities/password-reset.entity';
import { QrToken }             from './qr-token.entity';

@Module({
  imports: [
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Family, ParentAccount, Child, PinAttempt, EmailVerification, PasswordReset, QrToken]),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret:      c.get('JWT_SECRET'),
        signOptions: { expiresIn: c.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy],
  exports:     [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
