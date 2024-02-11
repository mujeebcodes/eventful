import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrganizerDto {
  @IsNotEmpty({ message: 'Organization name cannot be empty' })
  @IsString({ message: 'Organization name must be a string' })
  readonly organizationName: string;

  @IsOptional()
  readonly logo: Express.Multer.File;

  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  readonly email: string;

  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @IsString({ message: 'Phone number must be a string' })
  readonly phone: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  readonly password: string;

  @IsNotEmpty({ message: 'Bio cannot be empty' })
  @IsString({ message: 'Bio must be a string' })
  readonly bio: string;
}
