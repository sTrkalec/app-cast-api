import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, NextFunction } from 'express';
import { PrismaService } from './prisma/prisma.service';

// Define um novo tipo de solicitação que inclui o payload do token
export interface RequestMiddleware extends Request {
  user: {
    userId: string;
    name: string;
    email: string;
    iat: number;
    exp: number;
  };
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async use(req: RequestMiddleware, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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
        req.user = decoded;
        next();
      } catch (error) {
        throw new UnauthorizedException(error);
      }
    } else {
      throw new UnauthorizedException('Token JWT não fornecido');
    }
  }
}
