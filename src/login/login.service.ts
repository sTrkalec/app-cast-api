import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLoginDto } from './dto/create-login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { SuccessExceptionsService } from 'src/common/success-exceptions/success-exceptions.service';
import { Response } from 'express';

@Injectable()
export class LoginService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private success: SuccessExceptionsService,
  ) {}
  async loginDoctor(createLoginDto: CreateLoginDto, res: Response) {
    const { email, password } = createLoginDto;

    const doctor = await this.prismaService.doctor.findUnique({
      where: {
        email,
      },
    });

    const user = doctor
      ? doctor
      : await this.prismaService.patient.findUnique({
          where: {
            email,
          },
        });

    if (!user) {
      throw new HttpException(
        'Senha ou email incorretos',
        HttpStatus.NOT_FOUND,
      );
    }

    const passwordConfirmed = await compare(password, user.password);

    if (!passwordConfirmed) {
      throw new HttpException(
        'Senha ou email incorretos',
        HttpStatus.NOT_FOUND,
      );
    }

    const payload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      isDoctor: !!doctor,
    };

    const responseObj = {
      token: this.jwtService.sign(payload),
      isDoctor: !!doctor,
    };

    return this.success.successResponse(
      res,
      'User logged in successfully',
      HttpStatus.OK,
      responseObj,
    );
  }
}
