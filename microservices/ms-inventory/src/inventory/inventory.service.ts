import { Injectable, HttpException, HttpStatus, Logger, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { RegisterLossDto } from './dto/register-loss.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

interface ExcelRow {
  id_sucursal: string;
  id_producto: string;
  cantidad: number;
}

@Injectable()
export class InventoryService {
  private readonly supabaseClient: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
    }

    // Inicializamos el SDK de Supabase apuntando al esquema aislado 'inventory_db'
    this.supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        db: {
          schema: 'inventory_db',
        },
      },
    );
  }

  /**
   * Procesa la carga de stock inicial a partir de un archivo Excel.
   * Modifica 'stock_sucursal' e ingresa un movimiento de 'INGRESO' en 'kardex'.
   */
  async loadExcel(fileBuffer: Buffer) {
    this.logger.log('Iniciando carga de inventario desde archivo Excel...');
    
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
      this.logger.log(`Leídas ${rows.length} filas del archivo Excel.`);

      const results: any[] = [];

      for (const row of rows) {
        if (!row.id_sucursal || !row.id_producto || row.cantidad === undefined) {
          throw new BadRequestException('Formato de Excel inválido. Debe contener: id_sucursal, id_producto, cantidad.');
        }

        const cantidad = Number(row.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
          throw new BadRequestException(`Cantidad inválida (${row.cantidad}) para producto ${row.id_producto} en sucursal ${row.id_sucursal}.`);
        }

        // Consultar stock actual
        const { data: currentStock, error: getError } = await this.supabaseClient
          .from('stock_sucursal')
          .select('*')
          .eq('id_sucursal', row.id_sucursal)
          .eq('id_producto', row.id_producto)
          .maybeSingle();

        if (getError) {
          throw new InternalServerErrorException(`Error al consultar stock actual: ${getError.message}`);
        }

        let nuevoSaldo = cantidad;
        let updateResult;

        if (currentStock) {
          nuevoSaldo = Number(currentStock.cantidad) + cantidad;
          // Actualizar stock existente
          const { data, error: updateError } = await this.supabaseClient
            .from('stock_sucursal')
            .update({ cantidad: nuevoSaldo })
            .eq('id_stock', currentStock.id_stock)
            .select()
            .single();

          if (updateError) {
            throw new InternalServerErrorException(`Error al actualizar stock: ${updateError.message}`);
          }
          updateResult = data;
        } else {
          // Insertar nuevo stock
          const { data, error: insertError } = await this.supabaseClient
            .from('stock_sucursal')
            .insert({
              id_sucursal: row.id_sucursal,
              id_producto: row.id_producto,
              cantidad: nuevoSaldo,
            })
            .select()
            .single();

          if (insertError) {
            throw new InternalServerErrorException(`Error al insertar stock: ${insertError.message}`);
          }
          updateResult = data;
        }

        // Registrar en Kardex
        const { error: kardexError } = await this.supabaseClient
          .from('kardex')
          .insert({
            id_sucursal: row.id_sucursal,
            id_producto: row.id_producto,
            tipo_movimiento: 'INGRESO',
            cantidad: cantidad,
            motivo: 'Carga inicial por archivo Excel',
          });

        if (kardexError) {
          this.logger.error(`Error al registrar Kardex para carga Excel: ${kardexError.message}`);
        }

        results.push(updateResult);
      }

      this.rabbitClient.emit('InventoryLoaded', {
        tipo: 'excel',
        filas_procesadas: rows.length,
        timestamp: new Date().toISOString(),
      });

      return {
        message: 'Carga de inventario finalizada con éxito.',
        filas_procesadas: rows.length,
        data: results,
      };

    } catch (error) {
      this.logger.error(`Fallo al procesar Excel de inventario: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error al leer archivo Excel: ${error.message}`);
    }
  }

  /**
   * Obtiene la cantidad de stock disponible para un producto en una sucursal específica.
   */
  async getProductStock(id_producto: string, id_sucursal: string): Promise<number> {
    this.logger.log(`Consultando stock para producto ${id_producto} en sucursal ${id_sucursal}...`);
    
    const { data, error } = await this.supabaseClient
      .from('stock_sucursal')
      .select('cantidad')
      .eq('id_producto', id_producto)
      .eq('id_sucursal', id_sucursal)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al consultar stock: ${error.message}`);
      throw new InternalServerErrorException(`Error al obtener stock: ${error.message}`);
    }

    return data ? Number(data.cantidad) : 0;
  }

  /**
   * Registra una merma o pérdida física de inventario.
   * Resta del stock actual y guarda un movimiento 'EGRESO' en Kardex.
   */
  async registerLoss(dto: RegisterLossDto) {
    this.logger.log(`Registrando merma para producto ${dto.id_producto} en sucursal ${dto.id_sucursal}...`);

    const { data: currentStock, error: getError } = await this.supabaseClient
      .from('stock_sucursal')
      .select('*')
      .eq('id_sucursal', dto.id_sucursal)
      .eq('id_producto', dto.id_producto)
      .maybeSingle();

    if (getError) {
      throw new InternalServerErrorException(`Error al consultar stock: ${getError.message}`);
    }

    const stockActual = currentStock ? Number(currentStock.cantidad) : 0;
    if (stockActual < dto.cantidad) {
      throw new BadRequestException(`Stock insuficiente para registrar merma. Disponible: ${stockActual}, Solicitado: ${dto.cantidad}`);
    }

    const nuevoSaldo = stockActual - dto.cantidad;

    // Actualizar stock
    const { error: updateError } = await this.supabaseClient
      .from('stock_sucursal')
      .update({ cantidad: nuevoSaldo })
      .eq('id_stock', currentStock.id_stock);

    if (updateError) {
      throw new InternalServerErrorException(`Error al actualizar stock: ${updateError.message}`);
    }

    // Registrar en Kardex
    const { data: kardexDB, error: kardexError } = await this.supabaseClient
      .from('kardex')
      .insert({
        id_sucursal: dto.id_sucursal,
        id_producto: dto.id_producto,
        tipo_movimiento: 'EGRESO',
        cantidad: dto.cantidad,
        motivo: `Merma: ${dto.motivo}`,
      })
      .select()
      .single();

    if (kardexError) {
      this.logger.error(`Error al registrar Kardex para merma: ${kardexError.message}`);
    }

    if (nuevoSaldo < 10) {
      this.rabbitClient.emit('StockLow', {
        id_producto: dto.id_producto,
        id_sucursal: dto.id_sucursal,
        saldo: nuevoSaldo,
        limite: 10,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      message: 'Merma registrada con éxito.',
      id_producto: dto.id_producto,
      id_sucursal: dto.id_sucursal,
      saldo_restante: nuevoSaldo,
      kardex: kardexDB,
    };
  }

  /**
   * Transfiere stock desde una sucursal de origen hacia una sucursal de destino.
   * Valida stock en origen, actualiza ambas tablas e ingresa movimientos en Kardex.
   */
  async transferStock(dto: TransferStockDto) {
    this.logger.log(`Iniciando transferencia de ${dto.cantidad} unidades del producto ${dto.id_producto} desde ${dto.id_sucursal_origen} hacia ${dto.id_sucursal_destino}`);

    if (dto.id_sucursal_origen === dto.id_sucursal_destino) {
      throw new BadRequestException('La sucursal de origen y destino no pueden ser iguales.');
    }

    // 1. Obtener y Validar stock en sucursal origen
    const { data: stockOrigen, error: errorOrigen } = await this.supabaseClient
      .from('stock_sucursal')
      .select('*')
      .eq('id_sucursal', dto.id_sucursal_origen)
      .eq('id_producto', dto.id_producto)
      .maybeSingle();

    if (errorOrigen) {
      throw new InternalServerErrorException(`Error al obtener stock de origen: ${errorOrigen.message}`);
    }

    const cantOrigen = stockOrigen ? Number(stockOrigen.cantidad) : 0;
    if (cantOrigen < dto.cantidad) {
      throw new BadRequestException(`Stock insuficiente en origen. Disponible: ${cantOrigen}, Requerido: ${dto.cantidad}`);
    }

    // 2. Obtener stock en sucursal destino
    const { data: stockDestino, error: errorDestino } = await this.supabaseClient
      .from('stock_sucursal')
      .select('*')
      .eq('id_sucursal', dto.id_sucursal_destino)
      .eq('id_producto', dto.id_producto)
      .maybeSingle();

    if (errorDestino) {
      throw new InternalServerErrorException(`Error al obtener stock de destino: ${errorDestino.message}`);
    }

    const nuevoSaldoOrigen = cantOrigen - dto.cantidad;
    const cantDestino = stockDestino ? Number(stockDestino.cantidad) : 0;
    const nuevoSaldoDestino = cantDestino + dto.cantidad;

    // 3. Modificar stock de origen
    const { error: updateOrigenError } = await this.supabaseClient
      .from('stock_sucursal')
      .update({ cantidad: nuevoSaldoOrigen })
      .eq('id_stock', stockOrigen.id_stock);

    if (updateOrigenError) {
      throw new InternalServerErrorException(`Error al actualizar stock de origen: ${updateOrigenError.message}`);
    }

    // 4. Modificar/Insertar stock de destino
    if (stockDestino) {
      const { error: updateDestError } = await this.supabaseClient
        .from('stock_sucursal')
        .update({ cantidad: nuevoSaldoDestino })
        .eq('id_stock', stockDestino.id_stock);

      if (updateDestError) {
        // Rollback manual de origen
        await this.supabaseClient.from('stock_sucursal').update({ cantidad: cantOrigen }).eq('id_stock', stockOrigen.id_stock);
        throw new InternalServerErrorException(`Error al actualizar stock de destino: ${updateDestError.message}`);
      }
    } else {
      const { error: insertDestError } = await this.supabaseClient
        .from('stock_sucursal')
        .insert({
          id_sucursal: dto.id_sucursal_destino,
          id_producto: dto.id_producto,
          cantidad: nuevoSaldoDestino,
        });

      if (insertDestError) {
        // Rollback manual de origen
        await this.supabaseClient.from('stock_sucursal').update({ cantidad: cantOrigen }).eq('id_stock', stockOrigen.id_stock);
        throw new InternalServerErrorException(`Error al insertar stock de destino: ${insertDestError.message}`);
      }
    }

    // 5. Registrar movimientos de Kardex
    // Kardex de Salida (Origen)
    const { error: kardexOrigenErr } = await this.supabaseClient
      .from('kardex')
      .insert({
        id_sucursal: dto.id_sucursal_origen,
        id_producto: dto.id_producto,
        tipo_movimiento: 'TRANSFERENCIA',
        cantidad: dto.cantidad,
        motivo: `Transferencia egreso hacia sucursal ${dto.id_sucursal_destino}`,
      });

    if (kardexOrigenErr) {
      this.logger.error(`Error al registrar Kardex origen: ${kardexOrigenErr.message}`);
    }

    // Kardex de Entrada (Destino)
    const { error: kardexDestErr } = await this.supabaseClient
      .from('kardex')
      .insert({
        id_sucursal: dto.id_sucursal_destino,
        id_producto: dto.id_producto,
        tipo_movimiento: 'TRANSFERENCIA',
        cantidad: dto.cantidad,
        motivo: `Transferencia ingreso desde sucursal ${dto.id_sucursal_origen}`,
      });

    if (kardexDestErr) {
      this.logger.error(`Error al registrar Kardex destino: ${kardexDestErr.message}`);
    }

    this.rabbitClient.emit('TransferCompleted', {
      id_producto: dto.id_producto,
      id_sucursal_origen: dto.id_sucursal_origen,
      id_sucursal_destino: dto.id_sucursal_destino,
      cantidad: dto.cantidad,
      timestamp: new Date().toISOString(),
    });

    if (nuevoSaldoOrigen < 10) {
      this.rabbitClient.emit('StockLow', {
        id_producto: dto.id_producto,
        id_sucursal: dto.id_sucursal_origen,
        saldo: nuevoSaldoOrigen,
        limite: 10,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      message: 'Transferencia realizada con éxito.',
      id_producto: dto.id_producto,
      sucursal_origen: { id: dto.id_sucursal_origen, saldo: nuevoSaldoOrigen },
      sucursal_destino: { id: dto.id_sucursal_destino, saldo: nuevoSaldoDestino },
    };
  }

  /**
   * Retorna el historial de Kardex de una sucursal.
   */
  async getKardexHistory(id_sucursal: string) {
    this.logger.log(`Consultando Kardex para la sucursal: ${id_sucursal}`);
    
    const { data, error } = await this.supabaseClient
      .from('kardex')
      .select('*')
      .eq('id_sucursal', id_sucursal)
      .order('fecha', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Error al obtener historial del Kardex: ${error.message}`);
    }

    return data;
  }

  /**
   * Lógica asíncrona RabbitMQ para descontar stock automáticamente tras concretarse una venta.
   */
  async handleSaleCompletedEvent(payload: any) {
    const { id_venta, id_sucursal, detalles } = payload;

    if (!id_sucursal || !detalles || !Array.isArray(detalles)) {
      this.logger.warn(`Evento SaleCompleted recibido con payload inválido en ms-inventory: ${JSON.stringify(payload)}`);
      return;
    }

    this.logger.log(`Procesando baja de stock por venta completada. Venta ID: ${id_venta}, Sucursal ID: ${id_sucursal}`);

    for (const detail of detalles) {
      const { id_producto, cantidad } = detail;
      
      try {
        // Consultar stock actual
        const { data: stockRow, error: getError } = await this.supabaseClient
          .from('stock_sucursal')
          .select('*')
          .eq('id_sucursal', id_sucursal)
          .eq('id_producto', id_producto)
          .maybeSingle();

        if (getError) {
          this.logger.error(`Error al consultar stock de producto ${id_producto} en venta ${id_venta}: ${getError.message}`);
          continue;
        }

        const stockActual = stockRow ? Number(stockRow.cantidad) : 0;
        const nuevoSaldo = stockActual - Number(cantidad);

        if (stockRow) {
          // Actualizar stock
          const { error: updateError } = await this.supabaseClient
            .from('stock_sucursal')
            .update({ cantidad: nuevoSaldo })
            .eq('id_stock', stockRow.id_stock);

          if (updateError) {
            this.logger.error(`Error al restar stock para producto ${id_producto}: ${updateError.message}`);
            continue;
          }
        } else {
          // Insertar stock en negativo (caso anómalo si no existía previo, pero registramos consistencia)
          const { error: insertError } = await this.supabaseClient
            .from('stock_sucursal')
            .insert({
              id_sucursal,
              id_producto,
              cantidad: nuevoSaldo,
            });

          if (insertError) {
            this.logger.error(`Error al insertar stock inicial negativo para producto ${id_producto}: ${insertError.message}`);
            continue;
          }
        }

        // Registrar en Kardex
        const { error: kardexError } = await this.supabaseClient
          .from('kardex')
          .insert({
            id_sucursal,
            id_producto,
            tipo_movimiento: 'VENTA',
            cantidad: Number(cantidad),
            motivo: `Egreso automático por venta completada ID: ${id_venta}`,
          });

        if (kardexError) {
          this.logger.error(`Error al guardar Kardex de venta ${id_venta}: ${kardexError.message}`);
        }

        if (nuevoSaldo < 10) {
          this.rabbitClient.emit('StockLow', {
            id_producto,
            id_sucursal,
            saldo: nuevoSaldo,
            limite: 10,
            timestamp: new Date().toISOString(),
          });
        }

        this.logger.log(`Descontado stock con éxito: Producto ${id_producto}, Cantidad: ${cantidad}, Saldo restante: ${nuevoSaldo}`);

      } catch (error) {
        this.logger.error(`Fallo al descontar stock por venta para producto ${id_producto}: ${error.message}`);
      }
    }
  }

  /**
   * Obtiene el stock consolidado de un producto sumando las existencias en todas las sucursales.
   */
  async getConsolidatedStock(id_producto: string): Promise<number> {
    this.logger.log(`Consultando stock consolidado para producto: ${id_producto}`);
    
    const { data, error } = await this.supabaseClient
      .from('stock_sucursal')
      .select('cantidad')
      .eq('id_producto', id_producto);

    if (error) {
      this.logger.error(`Error al consultar stock consolidado: ${error.message}`);
      throw new InternalServerErrorException(`Error al obtener stock consolidado: ${error.message}`);
    }

    if (!data) return 0;
    const total = data.reduce((acc, row) => acc + Number(row.cantidad), 0);
    return total;
  }

  /**
   * Registra un ingreso individual de inventario manualmente.
   */
  async registerInput(dto: { id_sucursal: string; id_producto: string; cantidad: number }) {
    const { id_sucursal, id_producto, cantidad } = dto;
    if (!id_sucursal || !id_producto || cantidad === undefined || cantidad <= 0) {
      throw new BadRequestException('Formato de entrada inválido. Debe contener: id_sucursal, id_producto, cantidad (mayor a 0).');
    }

    this.logger.log(`Registrando ingreso manual de inventario para producto ${id_producto} en sucursal ${id_sucursal}`);

    // Consultar stock actual
    const { data: currentStock, error: getError } = await this.supabaseClient
      .from('stock_sucursal')
      .select('*')
      .eq('id_sucursal', id_sucursal)
      .eq('id_producto', id_producto)
      .maybeSingle();

    if (getError) {
      throw new InternalServerErrorException(`Error al consultar stock actual: ${getError.message}`);
    }

    let nuevoSaldo = cantidad;
    let updateResult;

    if (currentStock) {
      nuevoSaldo = Number(currentStock.cantidad) + cantidad;
      const { data, error: updateError } = await this.supabaseClient
         .from('stock_sucursal')
         .update({ cantidad: nuevoSaldo })
         .eq('id_stock', currentStock.id_stock)
         .select()
         .single();

      if (updateError) {
        throw new InternalServerErrorException(`Error al actualizar stock: ${updateError.message}`);
      }
      updateResult = data;
    } else {
      const { data, error: insertError } = await this.supabaseClient
         .from('stock_sucursal')
         .insert({
           id_sucursal,
           id_producto,
           cantidad: nuevoSaldo,
         })
         .select()
         .single();

      if (insertError) {
        throw new InternalServerErrorException(`Error al insertar stock: ${insertError.message}`);
      }
      updateResult = data;
    }

    // Registrar en Kardex
    const { error: kardexError } = await this.supabaseClient
      .from('kardex')
      .insert({
        id_sucursal,
        id_producto,
        tipo_movimiento: 'INGRESO',
        cantidad: cantidad,
        motivo: 'Ingreso manual individual',
      });

    if (kardexError) {
      this.logger.error(`Error al registrar Kardex para ingreso manual: ${kardexError.message}`);
    }

    // Emitimos evento InventoryLoaded (al finalizar de cargar el excel/input)
    this.rabbitClient.emit('InventoryLoaded', {
      id_sucursal,
      id_producto,
      cantidad,
      tipo: 'manual',
      nuevo_saldo: nuevoSaldo,
      timestamp: new Date().toISOString()
    });

    return {
      message: 'Ingreso de inventario registrado con éxito.',
      data: updateResult
    };
  }
}
