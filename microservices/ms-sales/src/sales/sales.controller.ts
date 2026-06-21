import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta registrada con éxito.' })
  @ApiResponse({
    status: 400,
    description: 'Datos de petición inválidos o stock insuficiente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createSaleDto: CreateSaleDto,
    @Req() req: any,
  ) {
    const token = req.token;
    return await this.salesService.createSale(createSaleDto, token);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el listado de todas las ventas' })
  @ApiResponse({
    status: 200,
    description: 'Listado de ventas devuelto con éxito.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAll() {
    return await this.salesService.findAllSales();
  }

  @Get('reports/daily')
  @ApiOperation({
    summary: 'Obtener reporte consolidado de ingresos del día agrupado por tipo de pago',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte consolidado devuelto con éxito.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getDailyReport(@Query('date') date: string) {
    return await this.salesService.getDailyReport(date);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener los detalles de una venta específica por su ID',
  })
  @ApiParam({ name: 'id', description: 'UUID de la venta', type: String })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la venta devuelto con éxito.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.salesService.findSaleById(id);
  }
}
