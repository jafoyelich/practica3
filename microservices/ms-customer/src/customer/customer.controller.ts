import { Controller, Get, Post, Body, Param, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AssignPointsDto } from './dto/assign-points.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente registrado con éxito.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(@Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateCustomerDto) {
    return await this.customerService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los clientes' })
  @ApiResponse({ status: 200, description: 'Listado de clientes devuelto con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAll() {
    return await this.customerService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un cliente por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente', type: String })
  @ApiResponse({ status: 200, description: 'Datos del cliente devueltos con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.customerService.findOne(id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el historial de puntos de fidelización de un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente', type: String })
  @ApiResponse({ status: 200, description: 'Historial devuelto con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getHistory(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.customerService.getHistory(id);
  }

  @Post(':id/points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar puntos de fidelización a un cliente manualmente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente', type: String })
  @ApiResponse({ status: 200, description: 'Puntos asignados y registrados en historial.' })
  @ApiResponse({ status: 400, description: 'Datos de puntos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async assignPoints(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: AssignPointsDto,
  ) {
    return await this.customerService.assignPoints(id, dto);
  }

  /**
   * Suscriptor asíncrono RabbitMQ.
   * Escucha el evento 'SaleCompleted' emitido por el ms-sales.
   */
  @EventPattern('SaleCompleted')
  async handleSaleCompleted(@Payload() data: any) {
    await this.customerService.handleSaleCompletedEvent(data);
  }
}