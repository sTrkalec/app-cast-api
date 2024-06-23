import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-doctor.dto';

export class UpdateDoctorDto extends PartialType(
  OmitType(CreateDoctorDto, ['email', 'password'] as const),
) {
  oldPassword?: string;
  newPassword?: string;
}
