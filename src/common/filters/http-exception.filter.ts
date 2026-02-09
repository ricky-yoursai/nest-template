import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CustomError } from '@/common/errors/custom.error';
import { Result } from '@/common/utils/result';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    this.logger.error(exception);

    if (exception instanceof CustomError) {
      const body = Result.fail({
        code: exception.code,
        message: exception.message,
      });
      response.status(exception.httpCode).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? Array.isArray((res as { message: unknown }).message)
            ? (res as { message: string[] }).message.join(', ')
            : (res as { message: string }).message
          : exception.message;
      const body = Result.fail({ code: status, message });
      response.status(status).json(body);
      return;
    }

    const body = Result.fail({
      code: 500,
      message: 'Internal Server Error',
    });
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
