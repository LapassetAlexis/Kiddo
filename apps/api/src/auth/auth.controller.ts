import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { AuthService }    from './auth.service';
import { JwtAuthGuard }   from './guards/jwt-auth.guard';
import { RolesGuard }     from './guards/roles.guard';
import { Roles }          from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class RegisterDto {
  @IsString()  @Length(1, 100) name:     string;
  @IsEmail()                   email:    string;
  @IsString()  @MinLength(8)   password: string;
}

class EmailDto {
  @IsEmail() email: string;
}

class VerifyCodeDto {
  @IsEmail()                        email: string;
  @IsString() @Length(6, 6)         code:  string;
}

class ResetPasswordDto {
  @IsEmail()                        email:       string;
  @IsString() @Length(6, 6)         code:        string;
  @IsString() @MinLength(8)         newPassword: string;
}

class ParentLoginDto {
  @IsEmail()               email:    string;
  @IsString() @MinLength(1) password: string;
}

class ChildPinDto {
  @IsString() childId: string;
  @IsString() pin:     string;
}

class QrLoginDto {
  @IsString() token: string;
}

class JoinFamilyDto {
  @IsString()  @Length(1, 100) name:       string;
  @IsEmail()                   email:      string;
  @IsString()  @MinLength(8)   password:   string;
  @IsString()                  inviteCode: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ── Registration ────────────────────────────────────────────────────────────

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.name, dto.email, dto.password);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: EmailDto) {
    return this.auth.resendVerification(dto.email);
  }

  // ── Password reset ──────────────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('verify-reset-code')
  @HttpCode(200)
  verifyResetCode(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyResetCode(dto.email, dto.code);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  @Post('parent/login')
  @HttpCode(200)
  parentLogin(@Body() dto: ParentLoginDto) {
    return this.auth.parentLogin(dto.email, dto.password);
  }

  @Post('child/pin')
  @HttpCode(200)
  childPin(@Body() dto: ChildPinDto) {
    return this.auth.childPin(dto.childId, dto.pin);
  }

  @Post('child/:id/qr-generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @HttpCode(200)
  generateQr(@Param('id') childId: string, @CurrentUser() user: JwtPayload) {
    return this.auth.generateQr(childId, user.familyId!);
  }

  @Post('child/qr-login')
  @HttpCode(200)
  qrLogin(@Body() dto: QrLoginDto) {
    return this.auth.loginQr(dto.token);
  }

  @Post('join-family')
  @HttpCode(200)
  joinFamily(@Body() dto: JoinFamilyDto) {
    return this.auth.joinFamily(dto.name, dto.email, dto.password, dto.inviteCode);
  }

  // ── Me ──────────────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.auth.getMe(user);
  }
}
