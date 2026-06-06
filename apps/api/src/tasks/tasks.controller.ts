import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService }     from './tasks.service';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { ScopedTaskGuard }  from '../auth/guards/scoped-task.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(
    @Query('childId') childId?: string,
    @Query('status')  status?: string,
    @CurrentUser()    user?: JwtPayload,
  ) {
    return this.svc.getAll(user?.familyId, childId, status);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @Query('childId') childId?: string,
    @CurrentUser()    user?: JwtPayload,
  ) {
    return this.svc.getHistory(user?.familyId, childId);
  }

  @Get('child/:childId')
  @UseGuards(JwtAuthGuard)
  getForChild(@Param('childId') childId: string, @CurrentUser() user: JwtPayload) {
    return this.svc.getAll(user?.familyId, childId);
  }

  @Post('exceptional')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async createExceptional(
    @Body() body: { childId: string; title: string; goldReward: number; difficulty?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const approverName = user.name ?? user.email ?? 'Parent';
    return this.svc.createExceptional(body as any, user.familyId!, approverName);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() body: { childId: string; title: string; goldReward: number; difficulty?: string; frequency?: string; timesPerDay?: number; bonusGold?: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.create(body as any, user.familyId!);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id') id: string, @Body() body: { note?: string; photoUrl?: string }, @CurrentUser() user: JwtPayload) {
    return this.svc.complete(id, user.sub, body.photoUrl, body.note);
  }

  @Patch(':id/approve')
  @UseGuards(ScopedTaskGuard)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.approve(id, user.sub, user.familyId!);
  }

  @Patch(':id/reject')
  @UseGuards(ScopedTaskGuard)
  reject(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: JwtPayload) {
    return this.svc.reject(id, user.sub, user.familyId!, body.reason);
  }
}
