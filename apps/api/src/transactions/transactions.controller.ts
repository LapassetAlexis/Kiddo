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

  /**
   * GET /transactions?childId=X&page=N
   * Parent or child — a child can only access their own history.
   */
  @Get()
  @Roles('parent', 'child')
  getHistory(
    @Query('childId') childId: string,
    @Query('page') page: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const familyId = user.role === 'child' ? user.familyId! : user.sub;
    return this.svc.getHistory(childId, familyId, page ? parseInt(page, 10) : 1);
  }

  /**
   * GET /transactions/balance/:childId
   * Parent or child — a child can only access their own balance.
   */
  @Get('balance/:childId')
  @Roles('parent', 'child')
  getBalance(
    @Param('childId') childId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const familyId = user.role === 'child' ? user.familyId! : user.sub;
    return this.svc.getBalance(childId, familyId);
  }

  /**
   * GET /transactions/streak/:childId
   * Parent or child — a child can only access their own streak.
   */
  @Get('streak/:childId')
  @Roles('parent', 'child')
  getStreak(
    @Param('childId') childId: string,
    @Query('timezone') timezone: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const familyId = user.role === 'child' ? user.familyId! : user.sub;
    return this.svc.getStreak(childId, familyId, timezone);
  }
}
