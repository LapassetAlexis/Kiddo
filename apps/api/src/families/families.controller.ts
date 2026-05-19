import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('families')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
export class FamiliesController {
  constructor(private readonly svc: FamiliesService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.svc.getMe(user.sub);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string; email?: string; timezone?: string },
  ) {
    return this.svc.updateProfile(user.sub, body);
  }

  @Patch('me/password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.svc.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.svc.deleteAccount(user.sub);
  }
}
