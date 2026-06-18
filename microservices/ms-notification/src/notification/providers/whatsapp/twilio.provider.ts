import { Injectable, Logger } from '@nestjs/common';
import { IWhatsappProvider } from '../../interfaces/whatsapp-provider.interface';

@Injectable()
export class TwilioProvider implements IWhatsappProvider {
  private readonly logger = new Logger(TwilioProvider.name);

  async send(params: { to: string; message: string }): Promise<void> {
    // Implementación placeholder para integración real con Twilio.
    // En un entorno productivo usarías @twilio/sdk o fetch a la API.
    this.logger.log(`(twilio) sending whatsapp to=${params.to}`);

    const shouldFail = process.env.WHATSAPP_TWILIO_SHOULD_FAIL === 'true';
    if (shouldFail) {
      throw new Error('TwilioProvider simulated failure');
    }
  }
}

