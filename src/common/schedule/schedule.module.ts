import { Module } from '@nestjs/common';
import { DailyTaskService } from './daily-task.service';

@Module({
  providers: [DailyTaskService],
  exports: [DailyTaskService],
})
export class ScheduleTaskModule {}
