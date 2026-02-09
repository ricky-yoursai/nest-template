import { Snowflake } from 'nodejs-snowflake';

// 配置：使用 2026-01-01 作为起始时间 (epoch)，机器 ID (instance_id) 设为 1
const config = {
  custom_epoch: 1767225600000, // 2026-01-01 00:00:00 UTC
  instance_id: 1,
};

// 实例化生成器
const uid = new Snowflake(config);

/**
 * 全局雪花 ID 生成器
 * 返回 string 类型以避免 JavaScript 的 Number 精度丢失问题
 */
export const generateSnowflakeId = (): string => {
  // getUniqueID() 返回的是 bigint，转为 string 返回
  return uid.getUniqueID().toString();
};
