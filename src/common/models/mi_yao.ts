import { generateSnowflakeId } from '@/common/utils/snowflake.util';
import { Model, Table, PrimaryKey, DataType, Column, BeforeCreate } from 'sequelize-typescript';

@Table({ underscored: true, tableName: 'miyao', comment: '密钥', paranoid: true })
export class MiYao extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: false, comment: '' })
  declare id: string;
  @Column({ type: DataType.TEXT })
  miyaoKey: string;
  @Column({ type: DataType.TEXT })
  miyaoValue: string;
  @Column({ type: DataType.TEXT })
  description: string;

  // 钩子：在创建数据前，如果 ID 为空，自动生成雪花 ID
  @BeforeCreate
  static async generateId(instance: MiYao) {
    if (!instance.id) {
      instance.id = generateSnowflakeId();
    }
  }
}
