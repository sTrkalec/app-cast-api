import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Res,
  Req,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Response } from 'express';
import { RequestMiddleware } from 'src/jwtMiddleware';

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
}
