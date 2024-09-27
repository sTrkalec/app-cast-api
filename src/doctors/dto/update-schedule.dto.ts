import { PartialType } from '@nestjs/mapped-types';
import { CreateSchuleDto } from './create-schedule.dto';
import { STATUS_SCHEDULE } from '@prisma/client';

export class UpdateScheduleDto extends PartialType(CreateSchuleDto) {
  status: STATUS_SCHEDULE;
}
