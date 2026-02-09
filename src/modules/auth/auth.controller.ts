import { Controller, Get, Post, Patch, Body, Query, Req, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Result } from '@/common/utils/result';
import { CustomError } from '@/common/errors/custom.error';
import { ErrorType, GetCodeType } from '@/common/utils';
import { Public } from '@/common/auth/public.decorator';
import type { Request } from 'express';
import { GetCodeDto } from './dto/get-code.dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@Controller('auth/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return Result.success({ code: 200, message: 'Register Success', data: data });
  }

  @Public()
  @Get('/code')
  async getCode(@Query() getCodeDto: GetCodeDto) {
    // if (!account) {
    //   throw new CustomError(ErrorType.PARAMS_INVALID, 'account 参数必传', 400);
    // }
    await this.authService.getCode(getCodeDto);
    return Result.success({ code: 200, message: 'Successfully' });
  }

  @Public()
  @Get('check-code')
  async checkCode(@Query() checkCodeDto: CheckCodeDto, @Req() req: Request) {
    const userId = req.auth?.id;
    await this.authService.checkCode(checkCodeDto, userId);
    return Result.success({ code: 200, message: '校验成功' });
  }

  /** 登录示例：返回 token */
  @Public()
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    // TODO: 校验账号密码、查库等
    const token = await this.authService.login(loginDto);
    return Result.success({ data: { token } });
  }

  /** 需鉴权：需携带 Bearer token，可访问 request.auth（含 jui） */
  @Get('/profile')
  getProfile(@Req() req: Request) {
    return Result.success({ data: req.auth });
  }

  /** 修改当前用户信息（修改后会清除该用户 Redis 缓存与 token，需重新登录） */
  @Put('/profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const userId = req.auth?.id;
    if (!userId) {
      throw new CustomError(ErrorType.PARAMS_INVALID, 'Unauthorized', 401);
    }
    const user = await this.authService.updateUser(userId, dto);
    return Result.success({ code: 200, message: 'Update Success', data: user });
  }

  /** 忘记密码：先 getCode(FORGOT_PASSWORD) → checkCode，再调本接口 */
  @Public()
  @Post('/forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return Result.success({ code: 200, message: '密码已重置，请使用新密码登录' });
  }

  /** 修改密码：登录后校验原密码并设置新密码 */
  @Put('/password')
  async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
    const userId = req.auth?.id;
    if (!userId) throw new CustomError(ErrorType.PARAMS_INVALID, 'Unauthorized', 401);
    await this.authService.updatePassword(userId, dto);
    return Result.success({ code: 200, message: '密码已修改' });
  }

  /** 更换邮箱：先对 newEmail 调 getCode(CHANGE_EMAIL) → checkCode（需登录），再调本接口 */
  @Put('/email')
  async changeEmail(@Req() req: Request, @Body() dto: ChangeEmailDto) {
    const userId = req.auth?.id;
    if (!userId) throw new CustomError(ErrorType.PARAMS_INVALID, 'Unauthorized', 401);
    const user = await this.authService.changeEmail(userId, dto);
    return Result.success({ code: 200, message: '邮箱已更换', data: user });
  }

  /** 更换手机号：TODO 接入短信后实现 */
  @Put('/phone')
  async changePhone(@Req() req: Request, @Body() body: { newPhone: string }) {
    const userId = req.auth?.id;
    if (!userId) throw new CustomError(ErrorType.PARAMS_INVALID, 'Unauthorized', 401);
    await this.authService.changePhone(userId, body.newPhone);
    return Result.success({ code: 200, message: '手机号已更换' });
  }
}
