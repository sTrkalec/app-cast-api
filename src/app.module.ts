import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorsModule } from './doctors/doctors.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsService } from './common/all-exceptions/all-exceptions.service';
import { SuccessExceptionsModule } from './common/success-exceptions/success-exceptions.module';
import { LoginModule } from './login/login.module';
import { JwtMiddleware } from './jwtMiddleware';
import { PatientsModule } from './patients/patients.module';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    PrismaModule,
    DoctorsModule,
    SuccessExceptionsModule,
    LoginModule,
    PatientsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsService,
    },
  ],
  controllers: [AuthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: '/login', method: RequestMethod.ALL },
        { path: '/doctors', method: RequestMethod.POST },
        { path: '/patients', method: RequestMethod.POST },
        { path: '/auth', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
