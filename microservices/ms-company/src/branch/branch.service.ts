import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  private readonly supabaseClient: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(BranchService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      'https://placeholder.supabase.co';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_KEY') || 'placeholder-key';

    if (
      !this.configService.get<string>('SUPABASE_URL') ||
      !this.configService.get<string>('SUPABASE_KEY')
    ) {
      this.logger.warn(
        'SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.',
      );
    }

    // Inicializamos el SDK de Supabase apuntando de forma estricta al esquema 'company_db'
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'company_db',
      },
    });

    this.logger.log(
      'SupabaseClient inicializado apuntando al esquema: company_db',
    );
  }

  async getCompanies() {
    this.logger.log('Listando todas las compañías...');
    const { data, error } = await this.supabaseClient
      .from('companias')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar compañías: ${error.message}`);
      throw new InternalServerErrorException(
        `Error al obtener compañías: ${error.message}`,
      );
    }
    return data;
  }

  async getCities() {
    this.logger.log('Listando todas las ciudades...');
    const { data, error } = await this.supabaseClient
      .from('ciudades')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar ciudades: ${error.message}`);
      throw new InternalServerErrorException(
        `Error al obtener ciudades: ${error.message}`,
      );
    }
    return data;
  }

  async getBranches() {
    this.logger.log('Listando todas las sucursales...');
    const { data, error } = await this.supabaseClient
      .from('sucursales')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar sucursales: ${error.message}`);
      throw new InternalServerErrorException(
        `Error al obtener sucursales: ${error.message}`,
      );
    }
    return data;
  }

  async createBranch(dto: CreateBranchDto) {
    this.logger.log(`Creando sucursal: ${dto.nombre}`);
    const { data, error } = await this.supabaseClient
      .from('sucursales')
      .insert({
        id_compania: dto.id_compania,
        id_ciudad: dto.id_ciudad,
        nombre: dto.nombre,
        direccion: dto.direccion,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al crear sucursal: ${error.message}`);
      throw new BadRequestException(
        `No se pudo crear la sucursal: ${error.message}`,
      );
    }
    return {
      message: 'Sucursal creada exitosamente.',
      branch: data,
    };
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    this.logger.log(`Actualizando sucursal con ID: ${id}`);

    // Verificamos si existe la sucursal
    const { data: existing, error: findError } = await this.supabaseClient
      .from('sucursales')
      .select('id_sucursal')
      .eq('id_sucursal', id)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(
        `Error al buscar sucursal: ${findError.message}`,
      );
    }

    if (!existing) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }

    const { data, error } = await this.supabaseClient
      .from('sucursales')
      .update({
        ...(dto.id_compania && { id_compania: dto.id_compania }),
        ...(dto.id_ciudad && { id_ciudad: dto.id_ciudad }),
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.direccion && { direccion: dto.direccion }),
      })
      .eq('id_sucursal', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al actualizar sucursal: ${error.message}`);
      throw new BadRequestException(
        `No se pudo actualizar la sucursal: ${error.message}`,
      );
    }
    return {
      message: 'Sucursal actualizada exitosamente.',
      branch: data,
    };
  }

  async createCompany(dto: { nombre: string }) {
    this.logger.log(`Creando compañía: ${dto.nombre}`);
    const { data, error } = await this.supabaseClient
      .from('companias')
      .insert({
        nombre: dto.nombre,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al crear compañía: ${error.message}`);
      throw new BadRequestException(
        `No se pudo crear la compañía: ${error.message}`,
      );
    }
    return {
      message: 'Compañía creada exitosamente.',
      company: data,
    };
  }
}
