import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn, IsOptional } from 'class-validator';
import type { RewardAvailability } from '../reward.entity';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsNumber()
  @IsPositive()
  cost: number;

  @IsIn(['unlimited', 'once'])
  @IsOptional()
  availability?: RewardAvailability;
}
