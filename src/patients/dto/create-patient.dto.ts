import { GENDER } from '@prisma/client';

export class CreatePatientDto {
  name: string;
  age: number;
  gender: GENDER;
  email: string;
  password: string;
}
