import { IsString, IsOptional, IsNotEmpty, IsIn, IsObject } from 'class-validator';
import type { ChildClass, AvatarConfig } from '../child.entity';

export class UpdateChildDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sprite?: string;

  @IsString()
  @IsOptional()
  @IsIn(['warrior', 'archer', 'mage', 'rogue'])
  class?: ChildClass;

  @IsObject()
  @IsOptional()
  avatarConfig?: AvatarConfig;
}
