import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateChildDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sprite?: string;
}
