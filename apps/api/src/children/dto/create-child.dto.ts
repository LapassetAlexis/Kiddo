import { IsString, IsNotEmpty, IsOptional, IsIn, IsObject, Length, Matches } from 'class-validator';
import type { ChildClass, AvatarConfig } from '../child.entity';

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
  @IsIn(['warrior', 'archer', 'mage', 'rogue'])
  class?: ChildClass;

  @IsObject()
  @IsOptional()
  avatarConfig?: AvatarConfig;

  @IsString()
  @IsOptional()
  sprite?: string;

  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
