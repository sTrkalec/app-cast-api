import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Res,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Response } from 'express';
import { RequestMiddleware } from 'src/jwtMiddleware';
import { CreateSchuleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto, @Res() res: Response) {
    return this.doctorsService.create(createDoctorDto, res);
  }

  @Patch()
  update(
    @Req() req: RequestMiddleware,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Res() res: Response,
  ) {
    return this.doctorsService.update(req, updateDoctorDto, res);
  }

  @Delete()
  remove(@Req() req: RequestMiddleware, @Res() res: Response) {
    return this.doctorsService.remove(req, res);
  }

  @Get()
  findById(@Req() req: RequestMiddleware) {
    return this.doctorsService.findById(req);
  }

  @Post('schedule')
  createSchedule(
    @Req() req: RequestMiddleware,
    @Body() createSchedule: CreateSchuleDto,
    @Res() res: Response,
  ) {
    return this.doctorsService.addSchedule(createSchedule, req, res);
  }

  @Patch('schedule/:id')
  updateSchedule(
    @Param('id') id: string,
    @Body() updateSchedule: UpdateScheduleDto,
    @Res() res: Response,
  ) {
    return this.doctorsService.updateSchedule(updateSchedule, id, res);
  }

  @Delete('schedule/:id')
  removeSchedule(@Param('id') id: string, @Res() res: Response) {
    return this.doctorsService.removeSchedule(id, res);
  }
}
