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

    const user = await this.prismaService.doctor.findUnique({
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
    };

    return this.success.successResponse(
      res,
      'Doctor logged in successfully',
      HttpStatus.OK,
      this.jwtService.sign(payload),
    );
  }

  loginPatient(createLoginDto: CreateLoginDto) {
    return this.prismaService.patient.findFirst({
      where: {
        AND: [
          { email: createLoginDto.email },
          { password: createLoginDto.password },
        ],
      },
    });
  }
}
