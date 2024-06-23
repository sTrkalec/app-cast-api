import { Global, Module } from '@nestjs/common';
import { SuccessExceptionsService } from './success-exceptions.service';

@Global()
@Module({
  providers: [SuccessExceptionsService],
  exports: [SuccessExceptionsService],
})
export class SuccessExceptionsModule {}
