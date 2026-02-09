import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'demos' })
export class Demo extends Model<Demo> {
  // 👇 关键在这里：加上 declare
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING })
  declare title: string; // 其实其他属性最好也加上 declare，或者是 !

  @Column({ type: DataType.TEXT })
  declare content: string;
}
