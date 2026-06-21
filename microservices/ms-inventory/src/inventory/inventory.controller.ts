import { Controller, Post, Get, Param, Query, Body, UseGuards, ValidationPipe, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import { RegisterLossDto } from './dto/register-loss.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { RegisterInputDto } from './dto/register-input.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('load_excel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cargar stock inicial e ingresos desde un archivo Excel' })
  @ApiBody({
    description: 'Archivo Excel con columnas: id_sucursal, id_producto, cantidad',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stock cargado con éxito e ingresos registrados.' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o datos mal formados.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @UseInterceptors(FileInterceptor('file'))
  async loadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo Excel no proporcionado.');
    }
    return await this.inventoryService.loadExcel(file.buffer);
  }

  @Get(':id_producto/stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el stock disponible de un producto en una sucursal' })
  @ApiParam({ name: 'id_producto', description: 'UUID del producto', type: String })
  @ApiQuery({ name: 'id_sucursal', description: 'UUID de la sucursal', type: String })
  @ApiResponse({ status: 200, description: 'Cantidad de stock disponible.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getStock(
    @Param('id_producto', new ParseUUIDPipe({ version: '4' })) id_producto: string,
    @Query('id_sucursal', new ParseUUIDPipe({ version: '4' })) id_sucursal: string,
  ) {
    const stock = await this.inventoryService.getProductStock(id_producto, id_sucursal);
    return { id_producto, id_sucursal, stock };
  }

  @Get('balance/:id_producto/consolidated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el stock consolidado total de un producto en todas las sucursales' })
  @ApiParam({ name: 'id_producto', description: 'UUID del producto', type: String })
  @ApiResponse({ status: 200, description: 'Cantidad total consolidada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getConsolidatedStock(
    @Param('id_producto', new ParseUUIDPipe({ version: '4' })) id_producto: string,
  ) {
    const total = await this.inventoryService.getConsolidatedStock(id_producto);
    return { id_producto, total };
  }

  @Post('input')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un ingreso de inventario individual manual' })
  @ApiResponse({ status: 201, description: 'Ingreso registrado con éxito y Kardex anotado.' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async registerInput(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: RegisterInputDto,
  ) {
    return await this.inventoryService.registerInput(dto);
  }

  @Post('loss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una baja de inventario por merma o vencimiento' })
  @ApiResponse({ status: 201, description: 'Merma registrada con éxito y egreso anotado en Kardex.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o parámetros inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async registerLoss(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: RegisterLossDto,
  ) {
    return await this.inventoryService.registerLoss(dto);
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transferir existencias entre sucursales' })
  @ApiResponse({ status: 201, description: 'Transferencia realizada con éxito y movimientos asentados en Kardex.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente en origen o parámetros inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async transferStock(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: TransferStockDto,
  ) {
    return await this.inventoryService.transferStock(dto);
  }

  @Get('kardex/:id_sucursal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el historial del Kardex de una sucursal' })
  @ApiParam({ name: 'id_sucursal', description: 'UUID de la sucursal', type: String })
  @ApiResponse({ status: 200, description: 'Historial de movimientos devuelto con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getKardex(
    @Param('id_sucursal', new ParseUUIDPipe({ version: '4' })) id_sucursal: string,
  ) {
    return await this.inventoryService.getKardexHistory(id_sucursal);
  }

  /**
   * Suscriptor asíncrono RabbitMQ.
   * Escucha el evento 'SaleCompleted' para descontar stock.
   */
  @EventPattern('SaleCompleted')
  async handleSaleCompleted(@Payload() payload: any) {
    await this.inventoryService.handleSaleCompletedEvent(payload);
  }
}
