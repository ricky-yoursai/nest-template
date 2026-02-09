import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Demo } from './entities/demo.entity';

@Module({
  imports: [SequelizeModule.forFeature([Demo])],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
