import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * 每天 00:00 执行的定时任务
 * Cron 表达式: 秒 分 时 日 月 周
 * '0 0 * * *' = 每天 0 点 0 分 0 秒
 */
@Injectable()
export class DailyTaskService {
  private readonly logger = new Logger(DailyTaskService.name);

  @Cron('0 0 * * *', {
    name: 'daily-midnight',
    timeZone: 'Asia/Shanghai', // 按中国时区 0 点执行
  })
  async handleDailyAtMidnight() {
    this.logger.log('⏰ 每日 00:00 定时任务开始执行');

    try {
      // 在这里写每天 0 点要做的逻辑，例如：
      // - 清理过期缓存
      // - 统计日报
      // - 发送每日汇总
      // - 重置每日限额等
      await this.doDailyJob();
    } catch (err) {
      this.logger.error('每日定时任务执行失败', err);
    }

    this.logger.log('⏰ 每日 00:00 定时任务执行完毕');
  }

  private async doDailyJob() {
    // 示例：可注入 RedisService、其他 Service 做具体业务
    // 当前仅打日志，便于你后续扩展
  }
}
