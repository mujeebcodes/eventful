import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  @IsString({ message: 'User ID must be a string' })
  readonly userId: string;

  @IsNotEmpty({ message: 'Event ID cannot be empty' })
  @IsString({ message: 'Event ID must be a string' })
  readonly eventId: string;

  @IsDateString({}, { message: 'Invalid date format for Enrollment Date' })
  readonly enrollmentDate: string;

  // qrCode can be generated or provided externally
  @IsString({ message: 'QR Code must be a string' })
  readonly qrCode: string;
}
