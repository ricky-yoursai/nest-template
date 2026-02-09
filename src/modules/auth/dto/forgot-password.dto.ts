import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'account 不能为空' })
  account: string;

  @IsString()
  @MinLength(6, { message: '新密码至少 6 位' })
  newPassword: string;
}
