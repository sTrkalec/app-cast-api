import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  @Get()
  @UseGuards(AuthGuard) // Usando o guard que valida o token JWT
  validateToken() {
    return { isActive: true, message: 'Token válido', status: 200 };
  }
}
