import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    res.status(status).json(this.buildResponse(exception, status, req.url));
  }

  private buildResponse(exception: unknown, status: number, path: string) {
    return {
      success: false,
      error: {
        statusCode: status,
        error: HttpStatus[status],
        message: this.extractMessage(exception),
        timestamp: new Date().toISOString(),
        path,
        requestId: uuidv4(),
      },
    };
  }

  private extractMessage(ex: unknown): string | string[] {
    if (!(ex instanceof HttpException)) return '서버 오류가 발생했습니다';
    const res = ex.getResponse();
    if (typeof res === 'object' && 'message' in res) return (res as { message: string | string[] }).message;
    return ex.message;
  }
}
