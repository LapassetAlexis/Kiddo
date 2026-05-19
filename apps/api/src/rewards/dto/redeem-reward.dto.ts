import { IsString, IsUUID } from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  @IsUUID()
  childId: string;
}
