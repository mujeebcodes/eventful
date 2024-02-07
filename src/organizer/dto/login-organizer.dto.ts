import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginOrganizerDto {
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  readonly email: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(3, { message: 'Password must be at least 3 characters long' })
  readonly password: string;
}
