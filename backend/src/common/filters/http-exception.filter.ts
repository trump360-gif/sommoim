import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        error: HttpStatus[status],
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: uuidv4(),
      },
    };

    response.status(status).json(errorResponse);
  }

  private extractMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'message' in response) {
        return (response as { message: string | string[] }).message;
      }
      return exception.message;
    }
    return '서버 오류가 발생했습니다';
  }
}
