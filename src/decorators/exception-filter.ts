import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException ? exception.getResponse() : exception;

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
    );

    const stack =
      exception instanceof Error ? exception.stack : 'No stack trace available';

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)} Stack Trace: ${stack}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      stack,
    });
  }
}
