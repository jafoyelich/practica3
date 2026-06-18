import { Injectable, HttpException, HttpStatus, Inject, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateSaleDto } from './dto/create-sale.dto';

interface CalculatedDetail {
  id_producto: string;
  cantidad: number;
  precio_unitario_cobrado: number;
  subtotal: number;
}

@Injectable()
export class SalesService {
  private readonly supabaseClient: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(SalesService.name);

  private readonly customerServiceUrl: string;
  private readonly productServiceUrl: string;
  private readonly inventoryServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject('SALES_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
    }

    // Inicializamos el SDK oficial de Supabase apuntando al esquema aislado 'sales_db'
    this.supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        db: {
          schema: 'sales_db',
        },
      },
    );

    // Inicializamos las URLs de los microservicios externos
    this.customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL') || 'http://localhost:3001';
    this.productServiceUrl = this.configService.get<string>('PRODUCT_SERVICE_URL') || 'http://localhost:3002';
    this.inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL') || 'http://localhost:3003';
  }

  /**
   * Valida la existencia y estado activo de un cliente mediante petición REST HTTP real.
   */
  private async validateCustomer(id_cliente: string, token: string): Promise<void> {
    const url = `${this.customerServiceUrl}/customers/${id_cliente}`;
    this.logger.log(`Validando cliente en: ${url}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      if (!response.data) {
        throw new BadRequestException(`El cliente con ID ${id_cliente} no existe.`);
      }
      
      if (response.data.activo === false || response.data.estado === 'INACTIVO') {
        throw new BadRequestException(`El cliente con ID ${id_cliente} está inactivo.`);
      }
    } catch (error) {
      this.logger.error(`Error al validar cliente ${id_cliente}: ${error.message}`);
      throw new BadRequestException(
        `No se pudo validar el cliente. Detalles: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Obtiene el precio real de un producto mediante petición REST HTTP real.
   */
  private async getProductPrice(id_producto: string, token: string): Promise<number> {
    const url = `${this.productServiceUrl}/products/${id_producto}`;
    this.logger.log(`Obteniendo precio de producto en: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      if (!response.data) {
        throw new BadRequestException(`El producto con ID ${id_producto} no existe.`);
      }

      const precio = response.data.precio_unitario ?? response.data.precio;
      if (precio === undefined || precio === null) {
        throw new InternalServerErrorException(`El precio del producto con ID ${id_producto} no fue devuelto.`);
      }

      return Number(precio);
    } catch (error) {
      this.logger.error(`Error al obtener producto ${id_producto}: ${error.message}`);
      throw new BadRequestException(
        `No se pudo obtener el precio del producto. Detalles: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Valida existencias del producto mediante petición REST HTTP real.
   */
  private async validateProductStock(id_producto: string, cantidadRequerida: number, token: string): Promise<void> {
    const url = `${this.inventoryServiceUrl}/inventory/${id_producto}/stock`;
    this.logger.log(`Verificando stock de producto en: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      if (!response.data) {
        throw new BadRequestException(`El producto con ID ${id_producto} no tiene registro en inventario.`);
      }

      const stockDisponible = response.data.stock ?? response.data.cantidad;
      if (stockDisponible === undefined || stockDisponible === null) {
        throw new InternalServerErrorException(`El stock del producto con ID ${id_producto} no pudo ser determinado.`);
      }

      if (Number(stockDisponible) < cantidadRequerida) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${id_producto}. Stock disponible: ${stockDisponible}, Requerido: ${cantidadRequerida}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al validar stock de producto ${id_producto}: ${error.message}`);
      throw new BadRequestException(
        `Error al validar existencias del producto. Detalles: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Registra una venta completa con validaciones HTTP reales y almacenamiento en Supabase.
   */
  async createSale(createSaleDto: CreateSaleDto, token: string) {
    let subtotalAcumulado = 0;
    const detallesCalculados: CalculatedDetail[] = [];

    try {
      this.logger.log(`Iniciando creación de venta para cliente: ${createSaleDto.id_cliente}`);

      // Paso 1: Validar cliente vía HTTP
      await this.validateCustomer(createSaleDto.id_cliente, token);

      // Paso 2: Validar productos y stock de cada detalle vía HTTP
      for (const detalle of createSaleDto.detalles) {
        const precioUnitario = await this.getProductPrice(detalle.id_producto, token);
        await this.validateProductStock(detalle.id_producto, detalle.cantidad, token);

        const subtotalDetalle = precioUnitario * detalle.cantidad;
        subtotalAcumulado += subtotalDetalle;

        detallesCalculados.push({
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario_cobrado: precioUnitario,
          subtotal: subtotalDetalle,
        });
      }

      const total = subtotalAcumulado;

      // Paso 4: Insertar en Supabase (Cabecera, Detalles, Comprobante)
      // 4.1. Insertar en tabla 'ventas'
      const { data: ventaDB, error: ventaError } = await this.supabaseClient
        .from('ventas')
        .insert({
          id_sucursal: createSaleDto.id_sucursal,
          id_cliente: createSaleDto.id_cliente,
          subtotal: subtotalAcumulado,
          total: total,
          estado: 'COMPLETADA',
        })
        .select()
        .single();

      if (ventaError) {
        throw new InternalServerErrorException(
          `Fallo al registrar la cabecera de la venta en base de datos: ${ventaError.message}`,
        );
      }

      const idVenta = ventaDB.id_venta;

      // 4.2. Insertar en tabla 'detalle_venta'
      const detallesInsert = detallesCalculados.map((item) => ({
        id_venta: idVenta,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario_cobrado: item.precio_unitario_cobrado,
        subtotal: item.subtotal,
      }));

      const { error: detallesError } = await this.supabaseClient
        .from('detalle_venta')
        .insert(detallesInsert);

      if (detallesError) {
        this.logger.warn(`Ejecutando rollback manual de la cabecera id_venta: ${idVenta}`);
        await this.supabaseClient.from('ventas').delete().eq('id_venta', idVenta);
        
        throw new InternalServerErrorException(
          `Fallo al registrar los detalles de la venta en base de datos: ${detallesError.message}`,
        );
      }

      // 4.3. Insertar en tabla 'comprobantes'
      const { data: comprobanteDB, error: comprobanteError } = await this.supabaseClient
        .from('comprobantes')
        .insert({
          id_venta: idVenta,
          fecha_emision: new Date().toISOString(),
        })
        .select()
        .single();

      if (comprobanteError) {
        this.logger.warn(`Ejecutando rollback manual completo para id_venta: ${idVenta}`);
        await this.supabaseClient.from('detalle_venta').delete().eq('id_venta', idVenta);
        await this.supabaseClient.from('ventas').delete().eq('id_venta', idVenta);

        throw new InternalServerErrorException(
          `Fallo al emitir el comprobante de la venta en base de datos: ${comprobanteError.message}`,
        );
      }

      const completeSalePayload = {
        ...ventaDB,
        detalles: detallesInsert,
        comprobante: comprobanteDB,
      };

      // Paso 5: Emitir a RabbitMQ 'SaleCompleted' y retornar 201
      this.rabbitClient.emit('SaleCompleted', completeSalePayload);
      this.logger.log(`Venta creada con éxito y evento 'SaleCompleted' emitido.`);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Venta registrada y comprobante emitido exitosamente.',
        data: completeSalePayload,
      };

    } catch (error) {
      this.logger.error(`Fallo crítico al procesar la venta: ${error.message}`);

      // Emitimos a RabbitMQ 'SaleCancelled'
      const cancelPayload = {
        dto: createSaleDto,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      this.rabbitClient.emit('SaleCancelled', cancelPayload);
      this.logger.log(`Evento 'SaleCancelled' emitido a RabbitMQ.`);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`No se pudo procesar la venta. Razón: ${error.message}`);
    }
  }

  /**
   * Obtiene la lista de todas las ventas.
   */
  async findAllSales() {
    this.logger.log('Consultando todas las ventas en Supabase...');
    const { data, error } = await this.supabaseClient
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Error al obtener ventas: ${error.message}`);
    }
    return data;
  }

  /**
   * Obtiene una venta por ID unida con su detalle y su comprobante.
   */
  async findSaleById(id: string) {
    this.logger.log(`Consultando detalles de venta por ID: ${id}`);
    
    const { data, error } = await this.supabaseClient
      .from('ventas')
      .select(`
        *,
        detalle_venta (*),
        comprobantes (*)
      `)
      .eq('id_venta', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException(`La venta con ID ${id} no existe.`, HttpStatus.NOT_FOUND);
      }
      throw new InternalServerErrorException(`Error al buscar la venta: ${error.message}`);
    }

    return data;
  }
}
