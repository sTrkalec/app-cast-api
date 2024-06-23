import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsService implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // Usar 'any' para ter acesso a propriedades não padrões
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      if (exception.cause === undefined) {
        status = exception.getStatus();
        message = exception.message;
      } else {
        switch (exception.cause) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message = 'This field already exists';
            break;

          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'This field does not exist';
            break;
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
