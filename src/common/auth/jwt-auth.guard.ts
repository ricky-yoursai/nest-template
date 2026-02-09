import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from './public.decorator';
import { CustomError } from '../errors/custom.error';
import { ErrorType } from '@/common/utils';

/**
 * JWT 鉴权守卫：全局使用，标记了 @Public() 的接口跳过鉴权
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!request.auth) {
      throw new CustomError(ErrorType.TOKEN_INVALID, 'Token Invalid', 401);
      // throw new UnauthorizedException('请先登录');
    }
    return true;
  }
}
