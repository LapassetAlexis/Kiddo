import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  @Get('child/:childId')
  getForChild(@Param('childId') childId: string) {
    return this.svc.getForChild(childId);
  }

  @Post()
  create(@Body() body: { childId: string; title: string; points: number; frequency?: string }) {
    return this.svc.create(body);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body() body: { photoUrl?: string }) {
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
