import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  @Get()
  getAll(
    @Query('childId') childId?: string,
    @Query('status')  status?: string,
  ) {
    return this.svc.getAll(childId, status);
  }

  @Get('history')
  getHistory(@Query('childId') childId?: string) {
    return this.svc.getHistory(childId);
  }

  @Get('child/:childId')
  getForChild(@Param('childId') childId: string) {
    return this.svc.getAll(childId);
  }

  @Post()
  create(@Body() body: { childId: string; title: string; points: number; frequency?: string; weekDay?: number }) {
    return this.svc.create(body);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body() body: { note?: string; photoUrl?: string }) {
    return this.svc.complete(id, body.photoUrl, body.note);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.approve(id, user.sub);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: JwtPayload) {
    return this.svc.reject(id, user.sub, body.reason);
  }
}
