import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AssignPointsDto } from './dto/assign-points.dto';

@Injectable()
export class CustomerService {
  private readonly supabaseClient: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(CustomerService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      'https://placeholder.supabase.co';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_KEY') || 'placeholder-key';

    // Inicializamos el SDK de Supabase apuntando al esquema aislado 'customer_db'
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'customer_db',
      },
    });
  }

  async create(dto: CreateCustomerDto) {
    this.logger.log(`Creando cliente: ${dto.nombre}`);
    const { data, error } = await this.supabaseClient
      .from('clientes')
      .insert({
        nombre: dto.nombre,
        ci: dto.ci,
        email: dto.email,
        telefono: dto.telefono,
        estado: dto.estado ?? 'ACTIVO',
        puntos: dto.puntos ?? 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al crear cliente: ${error.message}`);
      throw new HttpException(
        `No se pudo crear el cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data;
  }

  async findAll() {
    this.logger.log('Consultando todos los clientes...');
    const { data, error } = await this.supabaseClient
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar clientes: ${error.message}`);
      throw new HttpException(
        `Error al obtener clientes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data;
  }

  async findOne(id: string) {
    this.logger.log(`Buscando cliente por ID: ${id}`);
    const { data, error } = await this.supabaseClient
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
      }
      this.logger.error(`Error al buscar cliente: ${error.message}`);
      throw new HttpException(
        `Error al buscar cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data;
  }

  async getHistory(id: string) {
    this.logger.log(`Obteniendo historial de puntos para cliente: ${id}`);
    // Verificar si el cliente existe
    await this.findOne(id);

    const { data, error } = await this.supabaseClient
      .from('historial_puntos')
      .select('*')
      .eq('id_cliente', id)
      .order('fecha', { ascending: false });

    if (error) {
      this.logger.error(`Error al obtener historial: ${error.message}`);
      throw new HttpException(
        `Error al obtener historial: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data;
  }

  async assignPoints(id: string, dto: AssignPointsDto) {
    this.logger.log(`Asignando ${dto.puntos} puntos a cliente: ${id}`);

    // Obtener cliente y sus puntos actuales
    const customer = await this.findOne(id);
    const nuevosPuntos =
      Number(customer.puntos || 0) + Number(dto.puntos);

    // Actualizar cliente
    const { error: updateError } = await this.supabaseClient
      .from('clientes')
      .update({ puntos: nuevosPuntos })
      .eq('id', id);

    if (updateError) {
      this.logger.error(
        `Error al actualizar puntos de cliente: ${updateError.message}`,
      );
      throw new HttpException(
        `Error al asignar puntos: ${updateError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Insertar en historial de puntos
    const { data: historialData, error: historyError } =
      await this.supabaseClient
        .from('historial_puntos')
        .insert({
          id_cliente: id,
          puntos: dto.puntos,
          motivo: dto.motivo,
          fecha: new Date().toISOString(),
        })
        .select()
        .single();

    if (historyError) {
      this.logger.error(
        `Error al registrar historial de puntos: ${historyError.message}`,
      );
      // Revertir la actualización de puntos (Rollback manual)
      await this.supabaseClient
        .from('clientes')
        .update({ puntos: customer.puntos })
        .eq('id', id);

      throw new HttpException(
        `Error al registrar historial: ${historyError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      message: 'Puntos asignados con éxito',
      cliente: { ...customer, puntos: nuevosPuntos },
      historial: historialData,
    };
  }

  /**
   * Lógica asíncrona disparada al completarse una venta en ms-sales.
   * Calcula y suma puntos de fidelidad (ej. 1 punto por cada 10 Bs. de compra).
   */
  async handleSaleCompletedEvent(salePayload: any) {
    const { id_cliente, total, id_venta } = salePayload;
    if (!id_cliente || !total) {
      this.logger.warn(
        `Evento SaleCompleted recibido con payload incompleto: ${JSON.stringify(salePayload)}`,
      );
      return;
    }

    this.logger.log(
      `Procesando puntos por venta completada. Venta ID: ${id_venta}, Cliente ID: ${id_cliente}, Total Compra: ${total}`,
    );

    // Acumulación: 1 punto por cada 10 Bs de gasto
    const puntosAGanar = Math.floor(Number(total) / 10);

    if (puntosAGanar <= 0) {
      this.logger.log(
        `El total gastado (Bs. ${total}) no califica para acumular puntos (mínimo Bs. 10.00)`,
      );
      return;
    }

    try {
      await this.assignPoints(id_cliente, {
        puntos: puntosAGanar,
        motivo: `Puntos acumulados por compra realizada (Venta ID: ${id_venta})`,
      });
      this.logger.log(
        `Se otorgaron exitosamente ${puntosAGanar} puntos al cliente ${id_cliente}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al procesar acumulación de puntos automática por venta: ${error.message}`,
      );
    }
  }
}
