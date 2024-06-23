import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SuccessExceptionsService {
  successResponse(
    response: Response,
    message: string,
    status: number,
    data?: any,
  ) {
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      data,
    });
  }
}
