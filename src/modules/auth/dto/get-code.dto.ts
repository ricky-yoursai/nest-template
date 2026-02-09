import { CodeType, GetCodeType } from '@/common/utils';
import { IsString, IsOptional, MinLength, IsEnum, IsNotEmpty } from 'class-validator';

export class GetCodeDto {
  @IsEnum(CodeType, { message: 'The type is invalid' })
  @IsNotEmpty({ message: 'The type cannot be empty' })
  type: CodeType;

  @IsString()
  @IsNotEmpty({ message: 'The account  cannot be empty' })
  account: string;

  @IsString()
  @IsEnum(GetCodeType, { message: 'The getType is invalid' })
  @IsNotEmpty({ message: 'The getType cannot be empty' })
  getType: GetCodeType;
}
