import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
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
  controllers: [InventoryController],
  providers: [InventoryService, JwtAuthGuard],
  exports: [InventoryService, JwtAuthGuard, JwtModule],
})
export class InventoryModule {}
