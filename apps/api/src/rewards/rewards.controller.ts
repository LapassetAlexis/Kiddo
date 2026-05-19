import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardsController {
  constructor(private readonly svc: RewardsService) {}

  @Get()
  @Roles('parent')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAllForFamily(user.sub);
  }

  @Post()
  @Roles('parent')
  create(@Body() dto: CreateRewardDto, @CurrentUser() user: JwtPayload) {
    return this.svc.create(dto, user.sub);
  }

  @Get('history')
  @Roles('parent')
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('childId') childId?: string,
  ) {
    return this.svc.getHistory(user.sub, childId);
  }

  @Patch(':id')
  @Roles('parent')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.update(id, user.sub, dto);
  }

  @Delete(':id')
  @Roles('parent')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.sub);
  }

  /**
   * Child redeems a reward. The JWT carries childId (sub) and familyId.
   * Parent can also redeem on behalf of a child by providing childId in the body.
   */
  @Post(':id/redeem')
  @Roles('child', 'parent')
  @HttpCode(HttpStatus.OK)
  redeem(
    @Param('id') id: string,
    @Body() dto: RedeemRewardDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // For child tokens: sub = childId, familyId = familyId
    // For parent tokens: sub = familyId, childId must be in body
    const childId  = user.role === 'child' ? user.sub : dto.childId;
    const familyId = user.role === 'child' ? user.familyId! : user.sub;
    return this.svc.redeem(id, childId, familyId);
  }

  @Post(':id/grant')
  @Roles('parent')
  @HttpCode(HttpStatus.OK)
  grant(
    @Param('id') id: string,
    @Body() dto: RedeemRewardDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.grant(id, user.sub, dto.childId);
  }

  @Post(':id/refuse')
  @Roles('parent')
  @HttpCode(HttpStatus.OK)
  refuse(
    @Param('id') id: string,
    @Body() dto: RedeemRewardDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.refuse(id, user.sub, dto.childId);
  }
}
