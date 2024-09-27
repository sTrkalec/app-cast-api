import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Res,
  Req,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Response } from 'express';
import { RequestMiddleware } from 'src/jwtMiddleware';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto, @Res() res: Response) {
    return this.patientsService.create(createPatientDto, res);
  }

  @Patch()
  update(
    @Req() req: RequestMiddleware,
    @Body() updatePatientDto: UpdatePatientDto,
    @Res() res: Response,
  ) {
    return this.patientsService.update(req, updatePatientDto, res);
  }

  @Delete()
  remove(@Req() req: RequestMiddleware, @Res() res: Response) {
    return this.patientsService.remove(req, res);
  }

  @Get()
  findById(@Req() req: RequestMiddleware) {
    return this.patientsService.findById(req);
  }

  @Get('doctorAvailable')
  findDoctorsAvailable(@Req() req: RequestMiddleware) {
    return this.patientsService.findDoctorsAvailable(req);
  }
}
