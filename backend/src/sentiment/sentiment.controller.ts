import { Controller, Post, Body } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SentimentService } from './sentiment.service';

class AnalyzeSentimentDto {
  @IsNotEmpty({ message: 'Text is required' })
  @IsString()
  @MaxLength(1000, { message: 'Text must not exceed 1000 characters' })
  text: string;
}

@Controller('sentiment')
export class SentimentController {
  constructor(private readonly sentimentService: SentimentService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeSentimentDto) {
    return this.sentimentService.analyze(dto.text);
  }
}
