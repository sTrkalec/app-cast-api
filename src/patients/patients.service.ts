import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuccessExceptionsService } from 'src/common/success-exceptions/success-exceptions.service';
import { RequestMiddleware } from 'src/jwtMiddleware';
import { compare, hash } from 'bcrypt';
import { Response } from 'express';
import { DoctorsService } from 'src/doctors/doctors.service';

@Injectable()
export class PatientsService {
  constructor(
    private prismaService: PrismaService,
    private success: SuccessExceptionsService,
    private doctorService: DoctorsService,
  ) {}

  async findById(req: RequestMiddleware) {
    try {
      const { userId } = req.user;
      const patient = await this.prismaService.patient.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          gender: true,
          appointments: {},
          prescriptions: {},
          age: true,
        },
      });

      if (!patient) {
        throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
      }

      return this.success.successResponse(
        req.res,
        'Patient found successfully',
        HttpStatus.OK,
        patient,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }

  async create(createPatientDto: CreatePatientDto, res: Response) {
    try {
      // Verificar se todos os campos obrigatórios estão presentes
      const { name, age, email, password, gender } = createPatientDto;
      if (!name || !age || !email || !password || !gender) {
        throw new HttpException(
          'Missing required fields',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isPatient = await this.prismaService.doctor.findUnique({
        where: { email },
      });

      if (isPatient) {
        throw new HttpException(
          'Email already registered as doctor',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Criptografar a senha
      const saltOrRounds = 10;
      const hashedPassword = await hash(password, saltOrRounds);

      // Criar um novo registro de médico com a senha criptografada
      await this.prismaService.patient.create({
        data: {
          name,
          age,
          gender,
          email,
          password: hashedPassword,
        },
      });

      return this.success.successResponse(
        res,
        'Patient created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }

  async update(
    req: RequestMiddleware,
    updatePatientDto: UpdatePatientDto,
    res: Response,
  ) {
    try {
      const { userId } = req.user;
      const { oldPassword, newPassword, ...updateData } = updatePatientDto;
      const { name, age, gender } = updateData;

      if (!age && !name && !gender && !(newPassword && oldPassword)) {
        throw new HttpException(
          'Missing required fields',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (newPassword && oldPassword) {
        await this.updatePassword(userId, oldPassword, newPassword);
      }

      await this.prismaService.patient.update({
        where: { id: userId },
        data: updateData,
      });

      return this.success.successResponse(
        res,
        'Patient updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }

  private async updatePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      const patient = await this.prismaService.patient.findUnique({
        where: { id },
      });
      if (!patient) {
        throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
      }

      const isPasswordCorrect = await compare(oldPassword, patient.password);
      if (!isPasswordCorrect) {
        throw new HttpException('Invalid old password', HttpStatus.BAD_REQUEST);
      }

      const saltOrRounds = 10;
      const hashedPassword = await hash(newPassword, saltOrRounds);
      await this.prismaService.patient.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }

  async remove(req: RequestMiddleware, res: Response) {
    try {
      await this.prismaService.patient.delete({
        where: { id: req.user.userId },
      });

      await this.prismaService.blacklist.create({
        data: {
          token: req.headers.authorization,
          email: req.user.email,
          id: req.user.userId,
        },
      });

      return this.success.successResponse(
        res,
        'Patient deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }

  async findDoctorsAvailable(req: RequestMiddleware) {
    try {
      this.doctorService.verifySchedule();
      const doctors = await this.prismaService.doctor.findMany({
        where: { Schedule: { some: { status: 'DISPONIVEL' } } },
        select: {
          id: true,
          name: true,
          Schedule: {
            where: { status: 'DISPONIVEL' },
          },
        },
      });

      return this.success.successResponse(
        req.res,
        'Doctors found successfully',
        HttpStatus.OK,
        doctors,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error?.code,
          description: error?.message,
        },
      );
    }
  }
}
