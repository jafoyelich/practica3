import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from './email/email.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { SaleCreatedDto } from './dto/sale-created.dto';
import { NotificationRepository } from './repositories/notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async processSaleCreated(event: SaleCreatedDto): Promise<void> {
    // Nunca lanzar excepción hacia RabbitMQ (según requerimiento).

    const tasks: Promise<void>[] = [];

    // EMAIL
    tasks.push(
      (async () => {
        const id_notificacion = uuidv4();
        try {
          await this.emailService.sendConfirmation({
            cliente_nombre: event.cliente_nombre,
            cliente_email: event.cliente_email,
            id_venta: event.id_venta,
            nro_comprobante: event.nro_comprobante,
            fecha: event.fecha,
            total: event.total,
            detalle: event.detalle.map((d) => ({
              id_producto: d.id_producto,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              subtotal: d.subtotal,
            })),
          });

          await this.notificationRepository.insertRegistro({
            id_notificacion,
            id_cliente: event.id_cliente,
            tipo_medio: 'EMAIL',
            contenido: 'OK',
            fecha_envio: new Date(),
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`Email failed: ${message}`);
          try {
            await this.notificationRepository.insertRegistro({
              id_notificacion,
              id_cliente: event.id_cliente,
              tipo_medio: 'EMAIL',
              contenido: `ERROR: ${message}`,
              fecha_envio: new Date(),
            });
          } catch (dbErr: unknown) {
            const dbMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
            this.logger.error(`Email error logging failed: ${dbMessage}`);
          }
        }
      })(),
    );

    // WHATSAPP
    tasks.push(
      (async () => {
        const id_notificacion = uuidv4();
        try {
          await this.whatsAppService.sendConfirmation({
            cliente_nombre: event.cliente_nombre,
            cliente_telefono: event.cliente_telefono,
            nro_comprobante: event.nro_comprobante,
            total: event.total,
          });

          await this.notificationRepository.insertRegistro({
            id_notificacion,
            id_cliente: event.id_cliente,
            tipo_medio: 'WHATSAPP',
            contenido: 'OK',
            fecha_envio: new Date(),
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`WhatsApp failed: ${message}`);
          try {
            await this.notificationRepository.insertRegistro({
              id_notificacion,
              id_cliente: event.id_cliente,
              tipo_medio: 'WHATSAPP',
              contenido: `ERROR: ${message}`,
              fecha_envio: new Date(),
            });
          } catch (dbErr: unknown) {
            const dbMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
            this.logger.error(`WhatsApp error logging failed: ${dbMessage}`);
          }
        }
      })(),
    );

    await Promise.allSettled(tasks);
  }
}

