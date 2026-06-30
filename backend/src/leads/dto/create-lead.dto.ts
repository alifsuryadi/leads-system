import { IsEmail, IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Campaign ID is required' })
  @IsString()
  @MaxLength(50, { message: 'Campaign ID must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Campaign ID may only contain letters, numbers, hyphens, and underscores',
  })
  campaignId: string;
}
