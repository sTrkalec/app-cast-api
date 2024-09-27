import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, compare } from 'bcrypt';
import { Response } from 'express';
import { SuccessExceptionsService } from 'src/common/success-exceptions/success-exceptions.service';
import { RequestMiddleware } from 'src/jwtMiddleware';
import { CreateSchuleDto } from './dto/create-schedule.dto';
import { addMinutes, parseISO, isPast, isValid } from 'date-fns';
import { DoctorSchedules, ScheduleDetails } from './@types/doctor-schedules';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { STATUS_SCHEDULE } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(
    private prismaService: PrismaService,
    private success: SuccessExceptionsService,
  ) {}

  async verifySchedule(userId: string) {
    // Primeiro, buscar e excluir todas as agendas passadas e disponíveis
    const schedulesToDelete = await this.prismaService.schedule.findMany({
      where: {
        doctorId: userId,
        status: STATUS_SCHEDULE.DISPONIVEL,
        endTime: {
          lt: new Date(), // 'lt' significa 'less than'
        },
      },
      select: {
        id: true,
      },
    });

    // Excluir as agendas identificadas
    for (const schedule of schedulesToDelete) {
      await this.prismaService.schedule.delete({
        where: { id: schedule.id },
      });
    }
  }

  async findById(req: RequestMiddleware) {
    try {
      const { userId } = req.user;

      // Verificar se o médico tem agendas passadas e disponíveis
      await this.verifySchedule(userId);
      // Buscar as informações atualizadas do médico
      const doctor = await this.prismaService.doctor.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          specialty: true,
          email: true,
          appointments: true,
          prescriptions: true,
          Schedule: { orderBy: { startTime: 'asc' } },
        },
      });

      return this.success.successResponse(
        req.res,
        'Doctor found successfully',
        HttpStatus.OK,
        doctor,
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

  async create(createDoctorDto: CreateDoctorDto, res: Response) {
    try {
      // Verificar se todos os campos obrigatórios estão presentes
      const { name, specialty, email, password } = createDoctorDto;
      if (!name || !specialty || !email || !password) {
        throw new HttpException(
          'Missing required fields',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isPatient = await this.prismaService.patient.findUnique({
        where: { email },
      });

      if (isPatient) {
        throw new HttpException(
          'Email already registered as patient',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Criptografar a senha
      const saltOrRounds = 10;
      const hashedPassword = await hash(password, saltOrRounds);

      // Criar um novo registro de médico com a senha criptografada
      await this.prismaService.doctor.create({
        data: {
          name,
          specialty,
          email,
          password: hashedPassword,
        },
      });

      return this.success.successResponse(
        res,
        'Doctor created successfully',
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
    updateDoctorDto: UpdateDoctorDto,
    res: Response,
  ) {
    try {
      // Verificação básica de campos preenchidos
      const { userId } = req.user;
      const { oldPassword, newPassword, ...updateData } = updateDoctorDto;
      const { name, specialty } = updateData;
      if (!specialty && !name && !(newPassword && oldPassword)) {
        throw new HttpException(
          'Missing required fields',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (newPassword && oldPassword) {
        await this.updatePassword(userId, oldPassword, newPassword);
      } else if (!newPassword || oldPassword) {
        throw new HttpException(
          'Both old and new password are required',
          HttpStatus.BAD_REQUEST,
        );
      } else if (newPassword && !oldPassword) {
        throw new HttpException(
          'Old password is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prismaService.doctor.update({
        where: { id: userId },
        data: updateData,
      });

      return this.success.successResponse(
        res,
        'Doctor updated successfully',
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
      const doctor = await this.prismaService.doctor.findUnique({
        where: { id },
      });
      if (!doctor) {
        throw new HttpException('Doctor not found', HttpStatus.NOT_FOUND);
      }

      if (!oldPassword)
        throw new HttpException('Missing old password', HttpStatus.BAD_REQUEST);

      const isPasswordCorrect = await compare(oldPassword, doctor.password);
      if (!isPasswordCorrect) {
        throw new HttpException('Invalid old password', HttpStatus.BAD_REQUEST);
      }

      const saltOrRounds = 10;
      const hashedPassword = await hash(newPassword, saltOrRounds);
      await this.prismaService.doctor.update({
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
    console.log('chamou');

    console.log(req.user.userId);
    try {
      await this.prismaService.doctor.delete({
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
        'Doctor deleted successfully',
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

  async addSchedule(
    createSchedule: CreateSchuleDto,
    req: RequestMiddleware,
    res: Response,
  ) {
    const {
      date,
      morningStartTime,
      morningEndTime,
      afternoonStartTime,
      afternoonEndTime,
      duration = 60,
    } = createSchedule;

    // Função para criar horários para um período específico
    const createPeriodSchedule = async (
      start: string,
      end: string,
      duration: number,
    ) => {
      let times: ScheduleDetails[] = [];
      let startTime = parseISO(`${date}T${start}:00Z`);
      let endTime = parseISO(`${date}T${end}:00Z`);

      // Criar horários para o período especificado

      if (!isValid(startTime) || !isValid(endTime))
        throw new HttpException('Invalid date', HttpStatus.BAD_REQUEST);

      while (startTime < endTime) {
        let nextTime = addMinutes(startTime, duration);
        if (nextTime > endTime) break;

        // Verificar conflitos antes de criar
        const conflict = await this.prismaService.schedule.findFirst({
          where: {
            doctorId: req.user.userId,
            NOT: [
              { startTime: { gte: nextTime } },
              { endTime: { lte: startTime } },
            ],
          },
        });

        if (!conflict) {
          await this.prismaService.schedule.create({
            data: {
              doctorId: req.user.userId,
              startTime: startTime,
              endTime: nextTime,
              status: 'DISPONIVEL',
            },
          });

          times.push({
            start: startTime.toISOString(),
            end: nextTime.toISOString(),
          });
        } else {
          throw new HttpException('Schedule conflict', HttpStatus.CONFLICT);
        }
        startTime = nextTime;
      }
      return times;
    };

    try {
      let schedules: DoctorSchedules = {};

      // Criar horários para manhã, se fornecidos
      if (morningStartTime && morningEndTime) {
        schedules.morningSchedule = await createPeriodSchedule(
          morningStartTime,
          morningEndTime,
          duration,
        );
      }

      // Criar horários para tarde, se fornecidos
      if (afternoonStartTime && afternoonEndTime) {
        schedules.afternoonSchedule = await createPeriodSchedule(
          afternoonStartTime,
          afternoonEndTime,
          duration,
        );
      }

      return this.success.successResponse(
        res,
        'Doctor schedule created successfully',
        HttpStatus.OK,
        schedules,
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

  async updateSchedule(
    updateSchedule: UpdateScheduleDto,
    scheduleId: string,
    res: Response,
  ) {
    try {
      const { status } = updateSchedule;

      if (!scheduleId)
        throw new HttpException('Missing schedule ID', HttpStatus.BAD_REQUEST);

      if (!status) new HttpException('Missing status', HttpStatus.BAD_REQUEST);

      if (
        status !== STATUS_SCHEDULE.DISPONIVEL &&
        status !== STATUS_SCHEDULE.OCUPADO &&
        status !== STATUS_SCHEDULE.CANCELADO
      )
        throw new HttpException(
          'Status should be: DISPONIVEL  | OCUPADO | CANCELADO',
          HttpStatus.BAD_REQUEST,
        );
      // Verificar se a agenda existe
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) {
        throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
      }

      // Verificar se a agenda é passada
      if (isPast(schedule.endTime)) {
        throw new HttpException('Schedule is past', HttpStatus.CONFLICT);
      }

      // Atualizar a agenda para 'ocupada'
      await this.prismaService.schedule.update({
        where: { id: scheduleId },
        data: { status },
      });

      return this.success.successResponse(
        res,
        'Schedule updated successfully',
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

  async removeSchedule(scheduleId: string, res: Response) {
    try {
      if (!scheduleId)
        throw new HttpException('Missing schedule ID', HttpStatus.BAD_REQUEST);

      // Verificar se a agenda existe
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) {
        throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
      }

      // Verificar se a agenda é passada
      if (isPast(schedule.endTime)) {
        throw new HttpException('Schedule is past', HttpStatus.CONFLICT);
      }

      // Excluir a agenda
      await this.prismaService.schedule.delete({
        where: { id: scheduleId },
      });

      return this.success.successResponse(
        res,
        'Schedule deleted successfully',
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
}
