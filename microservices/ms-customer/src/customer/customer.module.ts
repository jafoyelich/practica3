import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-jwt-secret-key-erp-supermarket',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, JwtAuthGuard],
  exports: [CustomerService, JwtAuthGuard, JwtModule],
})
export class CustomerModule {}