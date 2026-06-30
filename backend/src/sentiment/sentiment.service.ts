import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  private readonly aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(private readonly httpService: HttpService) {}

  async analyze(text: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/analyze`, { text }),
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`AI service error: ${error.message}`);
        throw new HttpException(
          'AI service is unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        'Failed to analyze sentiment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
