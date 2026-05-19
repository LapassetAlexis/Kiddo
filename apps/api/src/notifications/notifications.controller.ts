import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('fcm-token')
  registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string },
  ) {
    if (user.role === 'child') {
      return this.svc.registerChildToken(user.sub, body.token);
    }
    return { message: 'Token enregistré' };
  }
}
