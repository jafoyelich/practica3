import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsappProvider } from '../../interfaces/whatsapp-provider.interface';
import { MetaWhatsappProvider } from './meta.provider';
import { TwilioProvider } from './twilio.provider';

export const WHATSAPP_PROVIDER_TOKEN = Symbol('WHATSAPP_PROVIDER_TOKEN');

@Injectable()
export class WhatsappFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly twilioProvider: TwilioProvider,
    private readonly metaProvider: MetaWhatsappProvider,
  ) {}

  getProvider(): IWhatsappProvider {
    const provider = (this.configService.get<string>('WHATSAPP_PROVIDER') ?? 'twilio').toLowerCase();
    if (provider === 'meta') return this.metaProvider;
    return this.twilioProvider;
  }
}

