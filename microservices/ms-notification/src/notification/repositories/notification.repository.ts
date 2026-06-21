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
    id_venta: string;
    id_cliente: string;
    tipo: NotificationTipoMedio;
    destinatario: string;
    mensaje: string;
    estado: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('registros_notificacion')
      .insert({
        id_venta: params.id_venta,
        id_cliente: params.id_cliente,
        tipo: params.tipo,
        destinatario: params.destinatario,
        mensaje: params.mensaje,
        estado: params.estado,
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
      .order('fecha', { ascending: false });

    if (error) {
      this.logger.error(`Error al consultar historial de notificaciones: ${error.message}`);
      throw error;
    }

    return data;
  }
}
