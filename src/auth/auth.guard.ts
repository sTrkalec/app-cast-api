import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT não fornecido');
    }

    const token = authHeader.substring(7);
    try {
      const decoded = this.jwtService.verify(token);

      const isBlacklisted = await this.prismaService.blacklist.findUnique({
        where: {
          token: 'Bearer ' + token,
          id: decoded.userId,
        },
      });

      if (isBlacklisted) {
        throw new UnauthorizedException('Token inválido ou na blacklist');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
