import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DemoModule } from './modules/demo/demo.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { ScheduleTaskModule } from './common/schedule/schedule.module';
import { Sequelize } from 'sequelize-typescript';

@Module({
  imports: [
    // 2. 加载 .env 文件 (一定要放在最前面)
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块，其他地方想用 ConfigService 也可以直接用
    }),
    ScheduleModule.forRoot(), // 定时任务
    CommonModule,
    // 3. 数据库配置改为异步加载 (forRootAsync)
    SequelizeModule.forRootAsync({
      imports: [ConfigModule], // 导入 ConfigModule
      inject: [ConfigService], // 注入 ConfigService
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '3306', 10), // 读取并转为数字
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadModels: true,
        synchronize: false,
        dialectOptions: {
          // 必须加这两个，否则查出来的 ID 精度会丢失
          decimalNumbers: true,
          supportBigNumbers: true,
          bigNumberStrings: true,
        },
      }),
    }),
    DemoModule,
    ScheduleTaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly sequelize: Sequelize) {}

  async onModuleInit() {
    await this.sequelize.sync({ alter: true });
    console.log('Database synced with { alter: true }');
  }
}
