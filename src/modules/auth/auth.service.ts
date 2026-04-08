import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomError } from '@/common/errors/custom.error';
import { RegisterDto } from './dto/register.dto';
import { CodeType, ErrorType, GetCodeType, getRedisUtil, LoginType, MailUtil, needDeleteKey, RegisterType, Tool } from '@/common/utils';
import { User } from '@/common/models';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { GetCodeDto } from './dto/get-code.dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

/** 生成 Token 时的载荷，会落到 JWT payload 中 */
export interface JwtPayload {
  sub: string; // 用户 ID
  username?: string;
  role?: string;
  jui?: string; // 自定义业务字段，如设备/会话标识
}

@Injectable()
export class AuthService {
  private redis = getRedisUtil();
  private readonly logger = new Logger(AuthService.name);
  /** 验证码有效期（秒） */
  private static readonly CODE_TTL = 120;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async login(loginDto: LoginDto) {
    const jui = randomUUID();
    const type = loginDto.type;
    const account = loginDto.account;
    const password = loginDto.password;
    const loginCode = loginDto.code;
    switch (type) {
      case LoginType.ACCOUNT: {
        // 帐号密码登陆
        const user = await User.findOne({
          where: {
            [Op.or]: [{ email: account }, { phone: account }],
          },
        });

        this.checkUser(user);
        const checkPassword = await bcrypt.compare(password, user.getDataValue('password'));
        if (!checkPassword) throw new CustomError(ErrorType.ACCOUNT_PASSWORD_ERROR, 'Incorrect account or password', 400);
        const token = this.generateToken(user, jui);
        await this.tokenToRedis(token, user, jui);
        const safeUser = Tool.handlerNeedDeleteKey(user);
        return {
          token: token,
          user: safeUser,
        };
      }
      case LoginType.APPLE: {
        break;
      }
      case LoginType.GOOGLE: {
      }
      case LoginType.APPLET: {
      }
      case LoginType.CODE: {
        if (!account) {
          throw new CustomError(ErrorType.PARAMS_INVALID, 'The account cannot be empty', 401);
        }
        const accountType = account.includes('@') ? 'EMAIL' : 'PHONE';
        if (!loginCode) {
          throw new CustomError(ErrorType.PARAMS_INVALID, 'The code cannot be empty', 401);
        }
        const code = await this.redis.get(`code:${CodeType.LOGIN}:${account}`);
        if (!code || code !== loginCode) {
          throw new CustomError(ErrorType.CODE_INVALID, 'The code is invalid', 401);
        }
        let user = await User.findOne({ where: { email: account } });
        if (!user) {
          const registerUser = await User.create({
            email: account,
            username: account.split('@')[0] ?? 'user',
            password: process.env.DEFAULT_PASSWORD ?? 'Yoursai12345',
            accountType: accountType,
          } as User);
          user = registerUser;
        }
        const token = this.generateToken(user, jui);
        await this.tokenToRedis(token, user, jui);
        const safeUser = Tool.handlerNeedDeleteKey(user);
        this.redis.del(`code:${CodeType.LOGIN}:${account}`);
        return {
          token: token,
          user: safeUser,
        };
      }
    }
  }
  public async register(registerDto: RegisterDto) {
    const account = registerDto.account;
    const username = registerDto.username;
    let safeUser: User | null = null;
    let token = '';
    switch (registerDto.type) {
      case RegisterType.EMAIL: {
        if (!account) {
          throw new CustomError(ErrorType.PARAMS_INVALID, 'The account cannot be empty', 401);
        }
        if (!registerDto.code) {
          throw new CustomError(ErrorType.PARAMS_INVALID, 'The code cannot be empty', 401);
        }
        const code = await this.redis.get(`code:${CodeType.REGISTER}:${account}`);
        if (!code || code !== registerDto.code) {
          throw new CustomError(ErrorType.CODE_INVALID, 'The code is invalid', 401);
        }
        const user = await User.findOne({ where: { email: account } });
        if (user) {
          throw new CustomError(ErrorType.REGISTERED, 'This email address is already registered', 401);
        }
        const registerUser = await User.create({
          email: account,
          username: username ?? account.split('@')[0] ?? 'user',
          password: registerDto.password,
          accountType: 'EMAIL',
        } as User);
        const jui = randomUUID();
        token = this.generateToken(registerUser, jui);
        await this.tokenToRedis(token, registerUser, jui);
        safeUser = Tool.handlerNeedDeleteKey(registerUser);
        this.redis.del(`code:${CodeType.REGISTER}:${account}`);
        break;
      }
      case RegisterType.PHONE: {
        break;
      }
      case RegisterType.GOOGLE: {
        break;
      }
      case RegisterType.APPLE: {
        break;
      }
      case RegisterType.APPLET: {
        break;
      }
    }
    if (!safeUser) throw new CustomError(ErrorType.ACCOUNT_PASSWORD_ERROR, 'Incorrect account or password', 401);
    return {
      token: token,
      user: safeUser,
    };
  }

  /** 校验验证码（单独接口，不分手机/邮箱）。校验通过后写入“已验证”标记，供忘记密码/更换邮箱等接口使用 */
  public async checkCode(checkCodeDto: CheckCodeDto, userId?: string) {
    const { account, code, type } = checkCodeDto;
    const key = this.getCodeRedisKey(type, account);
    const redisCode = await this.redis.get(key);
    if (!redisCode || !code) throw new CustomError(ErrorType.CODE_INVALID, '验证码无效或已过期', 401);
    if (code !== redisCode) throw new CustomError(ErrorType.CODE_INVALID, '验证码错误', 401);
    await this.redis.del(key);
    if (type === CodeType.FORGOT_PASSWORD) {
      await this.redis.set(`verified:${type}:${account}`, '1', AuthService.CODE_TTL);
    } else if (type === CodeType.CHANGE_EMAIL) {
      if (!userId) throw new CustomError(ErrorType.PARAMS_INVALID, '更换邮箱校验需先登录', 401);
      await this.redis.set(`verified:${type}:${account}`, userId, AuthService.CODE_TTL);
    }
  }

  public async getCode(getCodeDto: GetCodeDto) {
    const { type, getType, account } = getCodeDto;
    const code = Tool.generateCode();
    const key = this.getCodeRedisKey(type, account);

    await this.handleFrequentRequest(key);
    await this.redis.set(key, code, AuthService.CODE_TTL);

    try {
      if (getType === GetCodeType.EMAIL) {
        await this.sendEmailCode(type, account, code);
      } else {
        await this.sendPhoneCode(type, account, code);
      }
    } catch (error) {
      await this.redis.del(key);
      throw error;
    }
  }

  /** 忘记密码：需先调 getCode(FORGOT_PASSWORD) 再调 checkCode，本接口不校验 code */
  public async forgotPassword(dto: ForgotPasswordDto) {
    const { account, newPassword } = dto;
    const verifiedKey = `verified:${CodeType.FORGOT_PASSWORD}:${account}`;
    const verified = await this.redis.get(verifiedKey);
    if (!verified) throw new CustomError(ErrorType.CODE_INVALID, '请先获取并校验验证码', 401);
    await this.redis.del(verifiedKey);
    const user = await User.findOne({
      where: { [Op.or]: [{ email: account }, { phone: account }] },
    });
    this.checkUser(user);
    await user.update({ password: newPassword } as Partial<User>);
  }

  /** 修改密码：登录后修改，校验原密码 */
  public async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const { oldPassword, newPassword } = dto;
    const user = await User.findByPk(userId);
    this.checkUser(user);
    const match = await bcrypt.compare(oldPassword, user.getDataValue('password'));
    if (!match) throw new CustomError(ErrorType.ACCOUNT_PASSWORD_ERROR, '原密码错误', 400);
    await user.update({ password: newPassword } as Partial<User>);
  }

  /** 更换邮箱：需先对 newEmail 调 getCode(CHANGE_EMAIL) 再调 checkCode（需登录），本接口不校验 code */
  public async changeEmail(userId: string, dto: ChangeEmailDto) {
    const { newEmail } = dto;
    const verifiedKey = `verified:${CodeType.CHANGE_EMAIL}:${newEmail}`;
    const verifiedUserId = await this.redis.get(verifiedKey);
    if (!verifiedUserId || verifiedUserId !== userId) {
      throw new CustomError(ErrorType.CODE_INVALID, '请先对当前新邮箱获取并校验验证码', 401);
    }
    await this.redis.del(verifiedKey);
    const exist = await User.findOne({ where: { email: newEmail } });
    if (exist) throw new CustomError(ErrorType.REGISTERED, '该邮箱已被使用', 400);
    const user = await User.findByPk(userId);
    this.checkUser(user);
    await user.update({ email: newEmail } as Partial<User>);
    return Tool.handlerNeedDeleteKey(user);
  }

  /** 更换手机号：TODO 接入短信后实现，流程同更换邮箱 */
  public async changePhone(_userId: string, _newPhone: string) {
    // TODO: 1) getCode(CHANGE_PHONE, PHONE, newPhone) 2) checkCode 设置 verified 3) 本接口校验 verified 后更新 phone
    throw new CustomError(ErrorType.PARAMS_INVALID, '更换手机号暂未开通', 400);
  }

  /** 修改当前用户信息（会触发 User 的 AfterUpdate，自动清理 Redis 缓存与 token） */
  public async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await User.findByPk(userId);
    this.checkUser(user);
    const updateData = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined && v !== null)) as Partial<User>;
    await user.update(updateData);
    return Tool.handlerNeedDeleteKey(user);
  }

  /** 统一 Redis key：仅 type + account，checkCode 不分手机/邮箱 */
  private getCodeRedisKey(type: CodeType, account: string): string {
    return `code:${type}:${account}`;
  }

  private async sendEmailCode(type: CodeType, account: string, code: string) {
    const config = await MailUtil.getConfig();
    if (!config) {
      throw new CustomError(ErrorType.EMAIL_ERROR, '邮箱服务未配置', 500);
    }
    const subject = this.getCodeEmailSubject(type);
    const html = MailUtil.buildDefaultMailHTML(code);
    await MailUtil.sendMail(account, subject, html, config);
  }

  private getCodeEmailSubject(type: CodeType): string {
    const titles: Partial<Record<CodeType, string>> = {
      [CodeType.REGISTER]: '[YoursAI] 注册验证码',
      [CodeType.LOGIN]: '[YoursAI] 登录验证码',
      [CodeType.FORGOT_PASSWORD]: '[YoursAI] 找回密码验证码',
      [CodeType.CHANGE_EMAIL]: '[YoursAI] 更换邮箱验证码',
      [CodeType.CHANGE_PHONE]: '[YoursAI] 更换手机验证码',
      [CodeType.UPDATE_PASSWORD]: '[YoursAI] 修改密码验证码',
    };
    return titles[type] ?? '[YoursAI] 验证码';
  }

  private async sendPhoneCode(_type: CodeType, account: string, _code: string) {
    // TODO: 接入短信服务（阿里云、腾讯云等）后在此发送
    throw new CustomError(ErrorType.PARAMS_INVALID, `手机验证码暂未开通，请使用邮箱：${account}`, 400);
  }

  private generateToken(user: User, jui: string) {
    console.log(this.configService.get('TOKEN_EXPIRATION_TIME'));
    
    return this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        jui: jui,
      },
      {
        expiresIn: this.configService.get('TOKEN_EXPIRATION_TIME') ?? '7d',
      },
    );
  }

  /** 校验用户存在，否则抛错；调用后 TypeScript 会收窄为 User，可多处复用 */
  private checkUser(user: User | null): asserts user is User {
    if (!user) {
      throw new CustomError(ErrorType.ACCOUNT_PASSWORD_ERROR, 'Incorrect account or password', 401);
    }
  }

  private async tokenToRedis(token: string, user: User, jui: string) {
    const tokenExpirationTime = process.env.TOKEN_EXPIRATION_TIME ?? '7d';
    const time = Tool.parseDurationToSeconds(tokenExpirationTime);
    const IS_ONLY_SINGLE_USER_SIGN = process.env.IS_ONLY_SINGLE_USER_SIGN === 'true';
    if (IS_ONLY_SINGLE_USER_SIGN) {
      const oldJui = await this.redis.get(`session:jui:${jui}`);
      this.redis.del(`session:jui:${oldJui}`);
    }
    this.redis.set(`session:jui:${jui}`, user.id, time);
    // this.redis.set(`session:token:${user.id}`, token, time);
    // 登录时以用户 id 为 key 缓存用户信息（脱敏后）
    const safeUser = Tool.handlerNeedDeleteKey(user);
    this.redis.set(`session:user:${user.id}`, safeUser, time);
  }

  private async handleFrequentRequest(key: string) {
    const existing = await this.redis.exists(key);
    if (existing) {
      const ttl = await this.redis.ttl(key);
      const seconds = ttl > 0 ? ttl : 60;
      throw new CustomError(ErrorType.FREQUENT_REQUESTS, `验证码已发送，请 ${seconds} 秒后再请求`, 429);
    }
  }
}
