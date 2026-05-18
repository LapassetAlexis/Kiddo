import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('parent/login')
  @HttpCode(200)
  parentLogin(@Body() body: { email: string; password: string }) {
    return this.auth.parentLogin(body.email, body.password);
  }

  @Post('child/pin')
  @HttpCode(200)
  childPin(@Body() body: { childId: string; pin: string }) {
    return this.auth.childPin(body.childId, body.pin);
  }
}
