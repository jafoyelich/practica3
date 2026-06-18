import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsappProvider } from '../interfaces/whatsapp-provider.interface';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp/whatsapp.factory';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly provider: IWhatsappProvider,
  ) {}

  async sendConfirmation(params: {
    cliente_nombre: string;
    cliente_telefono: string;
    nro_comprobante: number;
    total: number;
  }): Promise<void> {
    const message = `Hola ${params.cliente_nombre}

Su compra fue registrada correctamente.

Comprobante: ${params.nro_comprobante}
Total: ${params.total}

Gracias por su compra.`;

    const shouldFail = this.configService.get<string>('WHATSAPP_SHOULD_FAIL') === 'true';
    if (shouldFail) {
      throw new Error('WhatsAppService simulated failure');
    }

    await this.provider.send({
      to: params.cliente_telefono,
      message,
    });

    this.logger.log(`WhatsApp sent to=${params.cliente_telefono}`);
  }
}

