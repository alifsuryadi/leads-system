import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SentimentController } from './sentiment.controller';
import { SentimentService } from './sentiment.service';

@Module({
  imports: [HttpModule],
  controllers: [SentimentController],
  providers: [SentimentService],
})
export class SentimentModule {}
