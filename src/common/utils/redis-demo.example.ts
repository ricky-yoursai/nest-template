/**
 * Redis 工具类使用示例
 * 可直接复制到 Service 或 Controller 中使用，或运行前请确保 Redis 已启动
 */
import { RedisUtil, getRedisUtil } from './redis.util';

async function demo() {
  // 方式一：使用默认单例（从环境变量读取 REDIS_HOST、REDIS_PORT 等）
  const redis = getRedisUtil();

  // 方式二：自定义配置
  // const redis = new RedisUtil({
  //   host: '127.0.0.1',
  //   port: 6379,
  //   password: '',
  //   db: 0,
  //   keyPrefix: 'myapp',
  // });

  try {
    // ========== 增：写入 ==========
    await redis.set('user:1001', '张三');
    await redis.set('count', 100);
    await redis.set('profile:1001', { name: '李四', age: 25 });

    // 增 + 设置过期时间（60 秒后过期）
    await redis.set('session:abc123', { userId: 1001, loginAt: Date.now() }, 60);

    console.log('增：已写入 user:1001, count, profile:1001, session:abc123');

    // ========== 查：读取 ==========
    const name = await redis.get('user:1001');
    console.log('查(字符串):', name);

    const count = await redis.get('count');
    console.log('查(数字字符串):', count);

    const profile = await redis.getJson<{ name: string; age: number }>('profile:1001');
    console.log('查(对象):', profile);

    const session = await redis.getJson('session:abc123');
    console.log('查(session):', session);

    // ========== 改：更新 ==========
    await redis.update('user:1001', '张三丰');
    await redis.update('count', 200);
    await redis.update('profile:1001', { name: '李四', age: 26, city: '北京' });

    console.log('改：已更新 user:1001, count, profile:1001');
    console.log('改后 user:1001 =', await redis.get('user:1001'));

    // ========== 设置过期时间 ==========
    await redis.set('temp:key', '临时数据');
    await redis.expire('temp:key', 30); // 30 秒后过期
    const ttl = await redis.ttl('temp:key');
    console.log('设置过期时间：temp:key 剩余秒数', ttl);

    // 或者写入时直接带过期时间
    await redis.set('captcha:13800138000', '123456', 300); // 5 分钟

    // ========== 删：删除 ==========
    await redis.del('user:1001');
    await redis.del(['count', 'profile:1001']); // 批量删
    console.log('删：已删除 user:1001, count, profile:1001');

    const exists = await redis.exists('user:1001');
    console.log('删后 user:1001 是否存在:', exists === 1);
  } finally {
    await redis.quit();
  }
}

// 在 Nest Service 中的典型用法示例（仅作参考，不执行）
/*
// auth.service.ts
import { getRedisUtil } from '@/utils/redis.util';

@Injectable()
export class AuthService {
  private redis = getRedisUtil();

  async setLoginToken(userId: string, token: string) {
    await this.redis.set(`token:${userId}`, token, 7 * 24 * 3600); // 7 天
  }

  async getLoginToken(userId: string) {
    return this.redis.get(`token:${userId}`);
  }

  async logout(userId: string) {
    await this.redis.del(`token:${userId}`);
  }
}
*/

export { demo };
