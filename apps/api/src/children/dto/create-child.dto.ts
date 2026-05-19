import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  avatar: string; // emoji

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
