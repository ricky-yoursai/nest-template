import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // 从请求头的 Authorization 字段中解析 Token (Bearer eyJhbG...)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 是否忽略过期？False 表示一旦过期直接返回 401，不会进入 validate 方法
      ignoreExpiration: false,
      // 密钥：必须和 AuthService 生成 Token 时用的密钥完全一致！
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * 2. 验证通过后的回调
   * 只有 Token 签名正确且未过期，才会执行此方法。
   * payload: 解密后的 JSON 数据 (即 AuthService 生成 Token 时传的那个对象)
   */
  async validate(payload: any) {
    // 可以在这里查数据库验证用户是否存在，但为了性能通常直接返回 payload 信息
    if (!payload.sub) {
      throw new UnauthorizedException('无效的 Token 载荷');
    }

    // 返回值会自动挂载到 request.user 上
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      jui: payload.jui,
    };
  }
}
