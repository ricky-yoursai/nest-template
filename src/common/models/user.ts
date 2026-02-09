import { Table, Column, Model, DataType, BeforeCreate, BeforeUpdate, AfterUpdate } from 'sequelize-typescript';
import { generateSnowflakeId } from '@/common/utils/snowflake.util';
import { getRedisUtil } from '@/common/utils/redis.util';
import * as bcrypt from 'bcrypt';

// // 2. 配置默认作用域：查询时默认排除 password
// @DefaultScope(() => ({
//   attributes: {
//     exclude: ['password'],
//   },
// }))
// // 3. 配置命名作用域：登录时需要用这个 scope 来把 password 查出来
// @Scopes(() => ({
//   withPassword: {
//     attributes: {
//       include: ['password'],
//     },
//   },
// }))
@Table({ tableName: 'users', timestamps: true, paranoid: true })
export class User extends Model<User> {
  // 核心修改：类型为 BIGINT，关闭自增，JS 中使用 string 类型接收
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: false, comment: '' })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '用户名' })
  declare username?: string | undefined;

  @Column({ type: DataType.STRING, allowNull: true, comment: '邮箱' })
  declare email?: string | undefined;

  @Column({ type: DataType.STRING, allowNull: true, comment: '手机号' })
  declare phone?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: 'openid' })
  declare openid?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: 'appleId' })
  declare appleId?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '账号类型:EMAIL: 邮箱, PHONE: 手机号, WECHAT: 微信, APPLE: 苹果', defaultValue: 'EMAIL' })
  declare accountType?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '头像' })
  declare avatar?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, comment: '性别:0: 男, 1: 女, 2: 未知', defaultValue: 2 })
  declare gender: number;

  @Column({ type: DataType.STRING, allowNull: true, comment: '生日' })
  declare birthday?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '国家', defaultValue: '中国' })
  declare country?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '省份' })
  declare province?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '城市' })
  declare city?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '语言', defaultValue: 'zh-CN' })
  declare language?: string;

  @Column({ type: DataType.STRING, allowNull: true, comment: '时区', defaultValue: 'Asia/Shanghai' })
  declare timezone?: string;
  @Column({ type: DataType.STRING, allowNull: true, comment: '密码' })
  declare password?: string;

  // 钩子：在创建数据前，如果 ID 为空，自动生成雪花 ID
  @BeforeCreate
  @BeforeUpdate
  static async generateId(instance: User) {
    if (!instance.id) {
      instance.id = generateSnowflakeId();
    }
    // 加密密码 没有传入密码就使用env的DEFAULT_PASSWORD
    if (!instance.password) {
      instance.password = process.env.DEFAULT_PASSWORD ?? 'ShareCard12345';
    }
    if (instance.changed('password')) {
      instance.password = await bcrypt.hash(instance.password, 10);
    }
  }

  /** 用户信息修改后：清除该用户在 Redis 中的缓存和 token，强制重新登录以获取最新信息 */
  @AfterUpdate
  static async clearUserRedisAndToken(instance: User) {
    const redis = getRedisUtil();
    const id = instance.id;
    const jui = await redis.get(`session:jui:${id}`);
    if (jui) {
      await redis.del(`session:token:${jui}`);
    }
    await redis.del([`session:jui:${id}`, `user:info:${id}`]);
  }
}
