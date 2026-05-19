import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  // GET /api/tasks?childId=X&status=Y  (dashboard parent + liste enfant)
  @Get()
  getAll(
    @Query('childId') childId?: string,
    @Query('status')  status?: string,
  ) {
    return this.svc.getAll(childId, status);
  }

  // GET /api/tasks/history?childId=X  (historique parent)
  @Get('history')
  getHistory(@Query('childId') childId?: string) {
    return this.svc.getHistory(childId);
  }

  // Ancienne route gardée pour compatibilité
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
    return this.svc.complete(id, body.photoUrl);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.svc.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.svc.reject(id, body.reason);
  }
}
