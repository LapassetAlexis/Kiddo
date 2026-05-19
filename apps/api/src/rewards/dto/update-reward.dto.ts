import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn, IsOptional } from 'class-validator';
import type { RewardAvailability } from '../reward.entity';

export class UpdateRewardDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  emoji?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  cost?: number;

  @IsIn(['unlimited', 'once'])
  @IsOptional()
  availability?: RewardAvailability;
}
