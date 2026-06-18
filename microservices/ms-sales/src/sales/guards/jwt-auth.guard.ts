import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token de autorización no proporcionado.');
    }
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'default-jwt-secret-key-erp-supermarket';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      // Adjuntamos el payload y el token a la request
      request['user'] = payload;
      request['token'] = token;
    } catch (error) {
      throw new UnauthorizedException('Token de autorización inválido o expirado.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
