import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, compare } from 'bcrypt';
import { Response } from 'express';
import { SuccessExceptionsService } from 'src/common/success-exceptions/success-exceptions.service';
import { RequestMiddleware } from 'src/jwtMiddleware';

@Injectable()
export class DoctorsService {
  constructor(
    private prismaService: PrismaService,
    private success: SuccessExceptionsService,
  ) {}

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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error?.code,
        description: error?.message,
      });
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

      // Se nova senha fornecida, atualizar senha
      if (newPassword && oldPassword) {
        await this.updatePassword(userId, oldPassword, newPassword);
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
        error?.response || 'Internal Server Error',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async updatePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const doctor = await this.prismaService.doctor.findUnique({
      where: { id },
    });
    if (!doctor) {
      throw new HttpException('Doctor not found', HttpStatus.NOT_FOUND);
    }

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
  }

  async remove(req: RequestMiddleware, res: Response) {
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
        error?.response || 'Internal Server Error',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
