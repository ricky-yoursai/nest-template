import { RegisterType } from '@/common/utils/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsEnum(RegisterType, { message: 'The registration type is invalid' })
  @IsNotEmpty({ message: 'The registration type cannot be empty' })
  type: RegisterType;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
