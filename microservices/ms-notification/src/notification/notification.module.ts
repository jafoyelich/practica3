import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from './email/email.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { TwilioProvider } from './providers/whatsapp/twilio.provider';
import { MetaWhatsappProvider } from './providers/whatsapp/meta.provider';
import { WhatsappFactory, WHATSAPP_PROVIDER_TOKEN } from './providers/whatsapp/whatsapp.factory';
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
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    WhatsAppService,
    NotificationRepository,
    TwilioProvider,
    MetaWhatsappProvider,
    WhatsappFactory,
    JwtAuthGuard,
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      useFactory: (factory: WhatsappFactory) => factory.getProvider(),
      inject: [WhatsappFactory],
    },
  ],
  exports: [NotificationService, JwtAuthGuard, JwtModule],
})
export class NotificationModule {}
