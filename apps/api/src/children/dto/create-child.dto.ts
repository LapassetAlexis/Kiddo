import { IsString, IsNotEmpty, IsOptional, IsIn, Length, Matches } from 'class-validator';
import type { ChildClass } from '../child.entity';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  avatar: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  @IsIn(['warrior','archer','mage','rogue','paladin'])
  class?: ChildClass;

  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
