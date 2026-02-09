import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ErrorType, getRedisUtil, Tool } from '../utils';
import { CustomError } from '../errors/custom.error';
import { User } from '../models';
import type { RequestAuth } from '../types/express';

/**
 * JWT 解析中间件：有 Token 时验证并挂载到 request.auth（含 jui），不污染其他字段
 * 仅解析，不拦截；是否鉴权由 JwtAuthGuard 控制
 */
@Injectable()
export class JwtParseMiddleware implements NestMiddleware {
  private redis = getRedisUtil();
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        username?: string;
        role?: string;
        jui?: string;
      }>(token);
      const parseToken = {
        userId: payload.sub,
        username: payload.username,
        role: payload.role,
        jui: payload.jui,
      };
      const userId = await this.redis.get(`session:jui:${parseToken.jui}`);
      if (!userId) throw new CustomError(ErrorType.TOKEN_INVALID, 'Token Invalid', 401);
      if (userId != parseToken.userId) {
        throw new CustomError(ErrorType.TOKEN_INVALID, 'Token Invalid', 401);
      }
      const user = await User.findByPk(userId);
      if (!user) throw new CustomError(ErrorType.TOKEN_INVALID, 'Token Invalid', 401);
      const safeUser = Tool.handlerNeedDeleteKey(user);
      req.auth = safeUser as unknown as RequestAuth;
    } catch {
      // Token 无效或过期，不设置 req.auth，由 Guard 统一返回 401
    }
    next();
  }
}
