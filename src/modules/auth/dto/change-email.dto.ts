import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: '请输入有效邮箱' })
  @IsNotEmpty({ message: '新邮箱不能为空' })
  newEmail: string;
}
