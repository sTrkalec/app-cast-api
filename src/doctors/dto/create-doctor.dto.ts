import { GENDER } from '@prisma/client';

export class CreateDoctorDto {
  name: string;
  specialty: string;
  gender: GENDER;
  age: number;
  email: string;
  password: string;
}
