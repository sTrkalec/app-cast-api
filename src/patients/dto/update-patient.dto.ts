import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['password', 'email'] as const),
) {
  oldPassword?: string;
  newPassword?: string;
}
