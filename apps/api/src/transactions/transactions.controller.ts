import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  @Roles('parent', 'child')
  getHistory(
    @Query('childId') childId: string,
    @Query('page') page: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolvedChildId = user.role === 'child' ? user.sub : childId;
    return this.svc.getHistory(resolvedChildId, user.familyId!, page ? parseInt(page, 10) : 1);
  }

  @Get('balance/:childId')
  @Roles('parent', 'child')
  getBalance(
    @Param('childId') childId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolvedChildId = user.role === 'child' ? user.sub : childId;
    return this.svc.getBalance(resolvedChildId, user.familyId!);
  }

  @Get('streak/:childId')
  @Roles('parent', 'child')
  getStreak(
    @Param('childId') childId: string,
    @Query('timezone') timezone: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolvedChildId = user.role === 'child' ? user.sub : childId;
    return this.svc.getStreak(resolvedChildId, user.familyId!, timezone);
  }
}
