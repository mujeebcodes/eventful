import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

enum Status {
  scheduled = 'scheduled',
  completed = 'completed',
}

export class CreateEventDto {
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @IsString({ message: 'Title must be a string' })
  readonly title: string;

  @IsNotEmpty({ message: 'Description cannot be empty' })
  @IsString({ message: 'Description must be a string' })
  readonly description: string;

  @IsNotEmpty({ message: 'Venue cannot be empty' })
  @IsString({ message: 'Venue must be a string' })
  readonly venue: string;

  @IsNotEmpty({ message: 'When cannot be empty' })
  @IsDateString({}, { message: 'Invalid date format for When' })
  readonly when: string;

  @IsNotEmpty({ message: 'Available tickets cannot be empty' })
  @IsInt({ message: 'Available tickets must be an integer' })
  @Min(0, { message: 'Available tickets must be greater than or equal to 0' })
  readonly availableTickets: number;

  @IsNotEmpty({ message: 'Event status cannot be empty' })
  @IsEnum(Status, { message: 'Invalid event status' })
  readonly eventStatus: Status;

  @IsNotEmpty({ message: 'Category cannot be empty' })
  @IsString({ message: 'Category must be a string' })
  readonly category: string;
}
