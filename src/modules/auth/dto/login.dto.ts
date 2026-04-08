import { LoginType } from '@/common/utils';
import { IsString, IsOptional, MinLength, IsEnum, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEnum(LoginType, { message: 'The login type is invalid' })
  @IsNotEmpty({ message: 'The login type cannot be empty' })
  type: LoginType;

  @IsString()
  @MinLength(1)
  account: string;

  @IsString()
  // @MinLength(1)
  @IsOptional()
  password?: string;

  @IsString()
  // @MinLength(1)
  @IsOptional()
  code?: string;
}
