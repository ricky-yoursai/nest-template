import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { RedisUtil, getRedisUtil, getRedisUtilInstance } from '@/common/utils/redis.util';

/**
 * 全局 Redis 模块：整个应用共用一个 Redis 连接，注入 RedisUtil 即可，不会重复建连。
 */
@Global()
@Module({
  providers: [
    {
      provide: RedisUtil,
      useFactory: () => getRedisUtil(),
    },
  ],
  exports: [RedisUtil],
})
export class RedisModule implements OnModuleDestroy {
  async onModuleDestroy() {
    const instance = getRedisUtilInstance();
    if (instance) await instance.quit();
  }
}
