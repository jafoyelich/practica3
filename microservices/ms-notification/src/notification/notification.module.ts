import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { TwilioProvider } from './providers/whatsapp/twilio.provider';
import { MetaWhatsappProvider } from './providers/whatsapp/meta.provider';
import { WhatsappFactory, WHATSAPP_PROVIDER_TOKEN } from './providers/whatsapp/whatsapp.factory';
import { AppController } from '../app.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationConsumer,
    NotificationService,
    EmailService,
    WhatsAppService,
    NotificationRepository,
    TwilioProvider,
    MetaWhatsappProvider,
    WhatsappFactory,
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      useFactory: (factory: WhatsappFactory) => factory.getProvider(),
      inject: [WhatsappFactory],
    },
  ],
})
export class NotificationModule {}

