import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type NotificationTipoMedio = 'EMAIL' | 'WHATSAPP' | 'SMS';

@Injectable()
export class NotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);
  private readonly supabase: SupabaseClient<any, any, any>;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_KEY') || this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
      throw new Error('Faltan las variables de entorno SUPABASE_URL o SUPABASE_KEY en ms-notification');
    }

    // Conexión exclusiva al esquema aislado 'notification_db'
    this.supabase = createClient(url, anonKey, {
      db: {
        schema: 'notification_db',
      },
    });
  }

  async insertRegistro(params: {
    id_notificacion: string;
    id_cliente: string;
    tipo_medio: NotificationTipoMedio;
    contenido: string;
    fecha_envio: Date;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('registros_notificacion')
      .insert({
        id_notificacion: params.id_notificacion,
        id_cliente: params.id_cliente,
        tipo_medio: params.tipo_medio,
        contenido: params.contenido,
        fecha_envio: params.fecha_envio.toISOString(),
      });

    if (error) {
      this.logger.error(`Error al insertar registro de notificación: ${error.message}`);
      throw error;
    }
  }

  async getHistory(id_cliente: string) {
    const { data, error } = await this.supabase
      .from('registros_notificacion')
      .select('*')
      .eq('id_cliente', id_cliente)
      .order('fecha_envio', { ascending: false });

    if (error) {
      this.logger.error(`Error al consultar historial de notificaciones: ${error.message}`);
      throw error;
    }

    return data;
  }
}
