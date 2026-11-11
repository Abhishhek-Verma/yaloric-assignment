import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName?: string;

  @IsEmail({}, { message: 'Please provide a valid email address (e.g. abhishek@gmail.com)' })
  @IsOptional()
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email?: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phone?: string;
}
