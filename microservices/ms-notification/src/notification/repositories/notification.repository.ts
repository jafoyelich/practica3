import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type NotificationTipoMedio = 'EMAIL' | 'WHATSAPP';

@Injectable()
export class NotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = configService.get<string>('SUPABASE_URL');
    const anonKey = configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
      // Se lanza para fallar rápido, pero el consumer debe manejar errores.
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    this.supabase = createClient(url, anonKey);
  }

  async insertRegistro(params: {
    id_notificacion: string;
    id_cliente: string;
    tipo_medio: NotificationTipoMedio;
    contenido: string;
    fecha_envio: Date;
  }): Promise<void> {
    const { data, error } = await this.supabase
      .from('registros_notificacion')
      .insert({
        id_notificacion: params.id_notificacion,
        id_cliente: params.id_cliente,
        tipo_medio: params.tipo_medio,
        contenido: params.contenido,
        fecha_envio: params.fecha_envio.toISOString(),
      });

    if (error) {
      this.logger.error(`insertRegistro failed: ${error.message}`);
      throw error;
    }

    if (!data) {
      // insert sin data en supabase no suele pasar, pero lo dejamos controlado.
      this.logger.warn('insertRegistro returned empty data');
    }
  }
}

