import { CodeType } from '@/common/utils';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CheckCodeDto {
  @IsEnum(CodeType, { message: 'type 无效' })
  @IsNotEmpty({ message: 'type 不能为空' })
  type: CodeType;

  @IsString()
  @IsNotEmpty({ message: 'account 不能为空' })
  account: string;

  @IsString()
  @IsNotEmpty({ message: 'code 不能为空' })
  code: string;
}
