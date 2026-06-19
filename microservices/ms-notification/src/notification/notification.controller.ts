import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('history/:id_cliente')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el historial de notificaciones enviadas a un cliente' })
  @ApiParam({ name: 'id_cliente', description: 'UUID del cliente', type: String })
  @ApiResponse({ status: 200, description: 'Historial de notificaciones devuelto con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado o sin notificaciones.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getHistory(@Param('id_cliente', new ParseUUIDPipe({ version: '4' })) id_cliente: string) {
    return await this.notificationService.getNotificationHistory(id_cliente);
  }

  /**
   * Suscriptor asíncrono RabbitMQ para recibir ventas completadas.
   */
  @EventPattern('SaleCompleted')
  async handleSaleCompleted(@Payload() data: any) {
    await this.notificationService.processSaleCompleted(data);
  }
}
