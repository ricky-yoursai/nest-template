import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'node:crypto';
import { needDeleteKey } from './config';

@Injectable()
export class Tool {
  private static readonly logger = new Logger(Tool.name);
  private static jwtService: JwtService;

  static initialize(jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  static generateCode() {
    return String(randomInt(10000, 100000));
  }

  static parseDurationToSeconds(timeStr: string): number {
    // 1. 如果本身就是数字 (比如 "604800")，直接返回
    if (!isNaN(Number(timeStr))) {
      return parseInt(timeStr, 10);
    }

    // 2. 正则分离 "数字" 和 "单位" (例如: 7d -> [7, 'd'])
    const match = timeStr.match(/^(\d+)([a-zA-Z]+)$/);
    if (!match) {
      this.logger.warn(`配置的过期时间格式错误: ${timeStr}，已回退到默认 7天`);
      return 7 * 24 * 60 * 60; // 默认 fallback
    }

    const value = parseInt(match[1], 10);
    const unit = match[2]; // 注意这里区分大小写，或者统一转小写

    // 3. 时间换算表
    switch (unit) {
      case 's': // 秒
        return value;
      case 'm': // 分钟 (standard)
      case 'min':
        return value * 60;
      case 'h': // 小时
        return value * 60 * 60;
      case 'd': // 天
        return value * 24 * 60 * 60;
      case 'w': // 周
        return value * 7 * 24 * 60 * 60;
      case 'M': // 月 (大写 M)
      case 'mo': // month
      case 'm':
        // 月是不定长的，通常在缓存场景按 30 天计算
        return value * 30 * 24 * 60 * 60;
      case 'y': // 年
        return value * 365 * 24 * 60 * 60;
      default:
        this.logger.warn(`未知的单位: ${unit}，按秒处理`);
        return value;
    }
  }

  static parseToken(token: string) {
    const payload = this.jwtService.verify<{
      sub: string;
      username?: string;
      role?: string;
      jui?: string;
    }>(token);
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      jui: payload.jui,
    };
  }

  static handlerNeedDeleteKey(target: any) {
    if (target && typeof target.toJSON === 'function') {
      target = target.toJSON();
    }
    if (Array.isArray(target)) {
      needDeleteKey.forEach(item => {
        target.forEach(i => {
          delete i[item];
        });
      });
    } else {
      needDeleteKey.forEach(item => {
        delete target[item];
      });
    }
    return target;
  }
}
