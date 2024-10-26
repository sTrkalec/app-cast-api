import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { DoctorsService } from 'src/doctors/doctors.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, DoctorsService],
})
export class PatientsModule {}
