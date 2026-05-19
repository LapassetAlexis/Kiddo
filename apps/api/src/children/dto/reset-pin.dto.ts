import { IsString, Length, Matches } from 'class-validator';

export class ResetPinDto {
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}
