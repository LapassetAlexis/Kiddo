import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('families')
export class FamiliesController {
  constructor(private readonly svc: FamiliesService) {}

  // Inscription gérée dans AuthController (POST /auth/register)
  @Post()
  register(@Body() body: { email: string; password: string }) {
    return this.svc.register(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.svc.getMe(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { email?: string; timezone?: string },
  ) {
    return this.svc.updateProfile(user.sub, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @Patch('me/password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.svc.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @Delete('me')
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.svc.deleteAccount(user.sub);
  }
}
