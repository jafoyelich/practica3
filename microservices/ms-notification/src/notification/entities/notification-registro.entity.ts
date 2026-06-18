export type TipoMedio = 'EMAIL' | 'WHATSAPP';

export class NotificationRegistroEntity {
  // Mapeo conceptual para tipo/estructura.
  constructor(
    public readonly id_notificacion: string,
    public readonly id_cliente: string,
    public readonly tipo_medio: TipoMedio,
    public readonly contenido: string,
    public readonly fecha_envio: Date,
  ) {}
}

