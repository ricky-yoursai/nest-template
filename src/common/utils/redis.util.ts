import Redis from 'ioredis';
import 'dotenv/config';

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

/**
 * Redis 工具类：增删改查、设置过期时间
 * 支持字符串与对象（自动 JSON 序列化/反序列化）
 *
 * 重要：不要每次 new RedisUtil()，应使用 getRedisUtil() 获取全局单例，
 * 否则每次都会新建 TCP 连接，导致慢且占满 Redis 连接数。
 * get/set 等每次调用复用的是同一连接，不会重复建连。
 */
export class RedisUtil {
  private client: Redis;
  private prefix: string;

  constructor(options: RedisOptions = {}) {
    this.client = new Redis({
      host: options.host ?? process.env.REDIS_HOST ?? '127.0.0.1',
      port: options.port ?? parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: options.password ?? process.env.REDIS_PASSWORD ?? undefined,
      db: options.db ?? parseInt(process.env.REDIS_DB ?? '0', 10),
      lazyConnect: true, // 首次命令时才建连，避免启动时阻塞
      maxRetriesPerRequest: 3,
    });
    this.prefix = options.keyPrefix ?? process.env.REDIS_KEY_PREFIX ?? '';
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * 增/改：设置 key 的值，可选过期时间（秒）
   */
  async set(key: string, value: string | number | object, ttlSeconds?: number): Promise<'OK' | null> {
    const k = this.getKey(key);
    const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds != null && ttlSeconds > 0) {
      return this.client.setex(k, ttlSeconds, v);
    }
    return this.client.set(k, v);
  }

  /**
   * 查：获取 key 的字符串值
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(this.getKey(key));
  }

  /**
   * 查：获取并解析为对象
   */
  async getJson<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * 删：删除一个或多个 key
   */
  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key.map(k => this.getKey(k)) : [this.getKey(key)];
    return this.client.del(...keys);
  }

  /**
   * 改：仅更新值，不改变原有过期时间；若 key 不存在则当作新增
   */
  async update(key: string, value: string | number | object): Promise<'OK' | null> {
    return this.set(key, value);
  }

  /**
   * 设置过期时间（秒）
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    return (await this.client.expire(this.getKey(key), seconds)) === 1;
  }

  /**
   * 设置过期时间（毫秒）
   */
  async pexpire(key: string, milliseconds: number): Promise<boolean> {
    return (await this.client.pexpire(this.getKey(key), milliseconds)) === 1;
  }

  /**
   * 获取 key 剩余过期时间（秒），-1 表示永不过期，-2 表示 key 不存在
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(this.getKey(key));
  }

  /**
   * 判断 key 是否存在
   */
  async exists(key: string): Promise<number> {
    return this.client.exists(this.getKey(key));
  }

  /**
   * 关闭连接
   */
  async quit(): Promise<void> {
    await this.client.quit();
  }

  /**
   * 获取底层 Redis 客户端（用于高级命令）
   */
  getClient(): Redis {
    return this.client;
  }
}

/** 全局单例：整个应用只维护一个 Redis 连接，所有 get/set 等调用复用该连接 */
let defaultInstance: RedisUtil | null = null;

/**
 * 获取 Redis 工具单例（推荐）。同一进程内多次调用返回同一实例，只建一次连接。
 * 在 Nest 中也可通过 RedisModule 注入 RedisUtil，底层是同一个实例。
 */
export function getRedisUtil(options?: RedisOptions): RedisUtil {
  if (!defaultInstance) {
    defaultInstance = new RedisUtil(options ?? {});
  }
  return defaultInstance;
}

/** 供 Nest 关闭时断开连接使用 */
export function getRedisUtilInstance(): RedisUtil | null {
  return defaultInstance;
}
