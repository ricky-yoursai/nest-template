import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { CustomError } from './common/errors/custom.error';
import { ErrorType } from './common/utils/enums';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  // 开启全局验证，并自动过滤掉 DTO 中不存在的字段 (whitelist: true)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // 自动将 payload 转换为 DTO 实例
      exceptionFactory: errors => {
        const constraints = errors[0].constraints ?? {};
        const message = Object.values(constraints)[0] || '参数校验错误';
        return new CustomError(ErrorType.PARAMS_INVALID, message, 400);
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
