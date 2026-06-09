import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';

export type FeedbackCategory = 'bug' | 'question' | 'feature';

export class CreateFeedbackDto {
  @IsEnum(['bug', 'question', 'feature'])
  category: FeedbackCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
