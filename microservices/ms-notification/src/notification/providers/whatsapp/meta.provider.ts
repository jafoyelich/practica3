import { Injectable, Logger } from '@nestjs/common';
import { IWhatsappProvider } from '../../interfaces/whatsapp-provider.interface';

@Injectable()
export class MetaWhatsappProvider implements IWhatsappProvider {
  private readonly logger = new Logger(MetaWhatsappProvider.name);

  async send(params: { to: string; message: string }): Promise<void> {
    // Implementación placeholder para integración real con Meta WhatsApp Cloud API.
    // En un entorno productivo usarías fetch/axios a la API.
    this.logger.log(`(meta) sending whatsapp to=${params.to}`);

    const shouldFail = process.env.WHATSAPP_META_SHOULD_FAIL === 'true';
    if (shouldFail) {
      throw new Error('MetaWhatsappProvider simulated failure');
    }
  }
}

