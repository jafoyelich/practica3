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

  /**
   * Procesa la notificación al recibir el evento asíncrono 'SaleCompleted' de RabbitMQ.
   */
  async processSaleCompleted(event: any): Promise<void> {
    const { id_venta, id_cliente, total } = event;
    if (!id_cliente || !id_venta) {
      this.logger.warn(`Evento SaleCompleted recibido con payload incompleto en ms-notification: ${JSON.stringify(event)}`);
      return;
    }

    this.logger.log(`Procesando notificación para venta completada. Venta ID: ${id_venta}, Cliente ID: ${id_cliente}, Total: ${total}`);

    const id_notificacion = uuidv4();
    const contenido = `Estimado cliente, su compra por un total de Bs. ${total} ha sido registrada con éxito. Nro de Referencia: ${id_venta}.`;

    // 1. Simulación de notificación mediante Logger nativo
    this.logger.log(`[NOTIFICACIÓN ENVIADA - SIMULACIÓN] Medio: EMAIL y WHATSAPP. Receptor Cliente ID: ${id_cliente}`);
    this.logger.log(`[CONTENIDO DE NOTIFICACIÓN]: "${contenido}"`);

    // 2. Persistencia en la Base de Datos (notification_db)
    try {
      await this.notificationRepository.insertRegistro({
        id_venta,
        id_cliente,
        tipo: 'EMAIL',
        destinatario: 'SIMULADO',
        mensaje: contenido,
        estado: 'SENT',
      });
      this.logger.log(`Notificación guardada en el historial de base de datos para cliente ${id_cliente}`);
    } catch (error: any) {
      this.logger.error(`Fallo al registrar historial de notificación en base de datos: ${error.message}`);
    }
  }

  /**
   * Consulta el historial de notificaciones enviadas a un cliente.
   */
  async getNotificationHistory(id_cliente: string) {
    this.logger.log(`Obteniendo historial de notificaciones para cliente: ${id_cliente}`);
    return await this.notificationRepository.getHistory(id_cliente);
  }

  /**
   * Método heredado para procesar sale.created.
   */
  async processSaleCreated(event: SaleCreatedDto): Promise<void> {
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
            id_venta: event.id_venta,
            id_cliente: event.id_cliente,
            tipo: 'EMAIL',
            destinatario: event.cliente_email || 'desconocido',
            mensaje: `Confirmación de venta emitida exitosamente a ${event.cliente_email}`,
            estado: 'SUCCESS',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`Email failed: ${message}`);
          try {
            await this.notificationRepository.insertRegistro({
              id_venta: event.id_venta,
              id_cliente: event.id_cliente,
              tipo: 'EMAIL',
              destinatario: event.cliente_email || 'desconocido',
              mensaje: `Error al enviar email: ${message}`,
              estado: 'ERROR',
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
            id_venta: event.id_venta,
            id_cliente: event.id_cliente,
            tipo: 'WHATSAPP',
            destinatario: event.cliente_telefono || 'desconocido',
            mensaje: `Confirmación de venta emitida exitosamente a WhatsApp ${event.cliente_telefono}`,
            estado: 'SUCCESS',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`WhatsApp failed: ${message}`);
          try {
            await this.notificationRepository.insertRegistro({
              id_venta: event.id_venta,
              id_cliente: event.id_cliente,
              tipo: 'WHATSAPP',
              destinatario: event.cliente_telefono || 'desconocido',
              mensaje: `Error al enviar WhatsApp: ${message}`,
              estado: 'ERROR',
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

  /**
   * Procesa la notificación al recibir el evento asíncrono 'TransferCompleted' de RabbitMQ.
   */
  async processTransferCompleted(event: any): Promise<void> {
    const { id_producto, id_sucursal_origen, id_sucursal_destino, cantidad } = event;
    this.logger.log(`Procesando notificación para transferencia completada. Producto: ${id_producto}, Origen: ${id_sucursal_origen}, Destino: ${id_sucursal_destino}`);

    const contenido = `Se ha completado la transferencia de ${cantidad} unidades del producto ${id_producto} desde la sucursal ${id_sucursal_origen} hacia la sucursal ${id_sucursal_destino}.`;

    this.logger.log(`[NOTIFICACIÓN DE TRANSFERENCIA - SIMULACIÓN]: "${contenido}"`);

    try {
      await this.notificationRepository.insertRegistro({
        id_venta: '00000000-0000-0000-0000-000000000000',
        id_cliente: '00000000-0000-0000-0000-000000000000',
        tipo: 'EMAIL',
        destinatario: 'ADMINISTRADORES',
        mensaje: contenido,
        estado: 'SENT',
      });
      this.logger.log('Notificación de transferencia guardada en base de datos.');
    } catch (error: any) {
      this.logger.error(`Fallo al registrar notificación de transferencia: ${error.message}`);
    }
  }

  /**
   * Procesa la notificación al recibir el evento asíncrono 'PointsAssigned' de RabbitMQ.
   */
  async processPointsAssigned(event: any): Promise<void> {
    const { id_cliente, puntos_asignados, nuevos_puntos, motivo } = event;
    this.logger.log(`Procesando notificación de puntos asignados. Cliente: ${id_cliente}, Puntos: ${puntos_asignados}`);

    const contenido = `¡Felicidades! Se te han asignado ${puntos_asignados} puntos de fidelidad por motivo de: ${motivo || 'acumulación general'}. Tu nuevo saldo es de ${nuevos_puntos} puntos.`;

    this.logger.log(`[NOTIFICACIÓN DE PUNTOS - SIMULACIÓN]: "${contenido}"`);

    try {
      await this.notificationRepository.insertRegistro({
        id_venta: '00000000-0000-0000-0000-000000000000',
        id_cliente: id_cliente,
        tipo: 'SMS',
        destinatario: 'CLIENTE',
        mensaje: contenido,
        estado: 'SENT',
      });
      this.logger.log(`Notificación de puntos guardada en base de datos para cliente ${id_cliente}`);
    } catch (error: any) {
      this.logger.error(`Fallo al registrar notificación de puntos: ${error.message}`);
    }
  }
}
