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
@Roles('parent')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  /**
   * GET /transactions?childId=X&page=N
   * Returns paginated transaction history for a child, 20 per page.
   * The child must belong to the authenticated family (IDOR protection).
   */
  @Get()
  getHistory(
    @Query('childId') childId: string,
    @Query('page') page: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.getHistory(childId, user.sub, page ? parseInt(page, 10) : 1);
  }

  /**
   * GET /transactions/balance/:childId
   * Returns computed balance stats: balance, earnedTotal, spentTotal,
   * earnedThisWeek, spentThisWeek.
   */
  @Get('balance/:childId')
  getBalance(
    @Param('childId') childId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.getBalance(childId, user.sub);
  }

  /**
   * GET /transactions/streak/:childId
   * Returns streak data computed from validated task dates.
   */
  @Get('streak/:childId')
  getStreak(
    @Param('childId') childId: string,
    @Query('timezone') timezone: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.getStreak(childId, user.sub, timezone);
  }
}
