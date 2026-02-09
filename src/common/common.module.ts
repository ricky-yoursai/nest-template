import { Global, Module, OnModuleDestroy, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestService } from '@/common/utils/request.service';
import { RedisUtil, getRedisUtil, getRedisUtilInstance } from '@/common/utils/redis.util';
import { SequelizeModule } from '@nestjs/sequelize';
import { MODELS } from '@/common/models';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard, JwtParseMiddleware, JwtStrategy } from './auth';
import { APP_GUARD } from '@nestjs/core';

@Global() // 关键：标记为全局，其他模块不用 import 就能用
@Module({
  imports: [
    SequelizeModule.forFeature(MODELS),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('TOKEN_EXPIRATION_TIME'),
        },
      }),
    }),
  ],

  providers: [RequestService, { provide: RedisUtil, useFactory: () => getRedisUtil() }, JwtStrategy, JwtParseMiddleware, { provide: APP_GUARD, useClass: JwtAuthGuard }],
  exports: [RequestService, RedisUtil],
})
export class CommonModule implements OnModuleDestroy, NestModule {
  async onModuleDestroy() {
    const instance = getRedisUtilInstance();
    if (instance) await instance.quit();
  }

  configure(consumer: MiddlewareConsumer) {
    // 全局挂载 JWT 解析中间件：所有路由都会先走这里
    consumer.apply(JwtParseMiddleware).forRoutes('*');
  }
}
