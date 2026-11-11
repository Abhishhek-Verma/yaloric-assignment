import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'An unexpected error occurred. Please try again.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res !== null && (res as any).message
        ? (res as any).message
        : res;
    } else if (typeof exception === 'object' && exception !== null && 'code' in exception) {
      const prismaError = exception as any;
      if (prismaError.code === 'P2000') {
        status = HttpStatus.BAD_REQUEST;
        message = 'One or more input values are too long for the permitted field length.';
      } else if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A user with this email already exists.';
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Requested record was not found.';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
