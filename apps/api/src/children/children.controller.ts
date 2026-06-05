import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
export class ChildrenController {
  constructor(private readonly svc: ChildrenService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAllForFamily(user.familyId!);
  }

  @Post()
  create(@Body() dto: CreateChildDto, @CurrentUser() user: JwtPayload) {
    return this.svc.create(dto, user.familyId!);
  }

  @Get(':id')
  @Roles('parent', 'child')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const resolvedId = user.role === 'child' ? user.sub : id;
    return this.svc.findOneWithStats(resolvedId, user.familyId!);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.update(id, user.familyId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.familyId!);
  }

  @Post(':id/reset-pin')
  @HttpCode(HttpStatus.OK)
  resetPin(
    @Param('id') id: string,
    @Body() dto: ResetPinDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.resetPin(id, user.familyId!, dto.newPin);
  }

  @Get(':id/balance')
  getBalance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.getBalance(id, user.familyId!);
  }

  @Post(':id/ack-levelup')
  @Roles('parent', 'child')
  @HttpCode(HttpStatus.NO_CONTENT)
  ackLevelUp(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const resolvedId = user.role === 'child' ? user.sub : id;
    return this.svc.ackLevelUp(resolvedId, user.familyId!);
  }

  @Patch(':id/level-objective')
  @HttpCode(HttpStatus.NO_CONTENT)
  setLevelObjective(
    @Param('id') id: string,
    @Body() body: { targetLevel: number | null; rewardTitle: string | null },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.setLevelObjective(id, user.familyId!, body.targetLevel, body.rewardTitle);
  }
}
