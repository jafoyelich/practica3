import { Injectable, Inject, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  private readonly supabaseClient: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
    }

    // Inicializamos el SDK de Supabase apuntando al esquema aislado 'product_db'
    this.supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        db: {
          schema: 'product_db',
        },
      },
    );
  }

  async createProduct(createProductDto: CreateProductDto) {
    this.logger.log(`Creando producto: ${createProductDto.nombre}`);
    
    const { data, error } = await this.supabaseClient
      .from('productos')
      .insert({
        id_categoria: createProductDto.id_categoria,
        id_marca: createProductDto.id_marca,
        codigo_barras: createProductDto.codigo_barras,
        nombre: createProductDto.nombre,
        precio_base: createProductDto.precio_base,
        estado: createProductDto.estado || 'activo',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al crear producto: ${error.message}`);
      throw new BadRequestException(`No se pudo crear el producto: ${error.message}`);
    }

    this.rabbitClient.emit('ProductCreated', data);
    return {
      message: 'Producto creado exitosamente',
      product: {
        ...data,
        precio_unitario: Number(data.precio_base) // Para compatibilidad con ms-sales
      }
    };
  }

  async findAllProducts() {
    this.logger.log('Consultando catálogo de productos...');
    const { data, error } = await this.supabaseClient
      .from('productos')
      .select(`
        *,
        categorias (nombre),
        marcas (nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al obtener productos: ${error.message}`);
      throw new InternalServerErrorException(`Error al obtener productos: ${error.message}`);
    }

    // Aplanamos la estructura devuelta por el embedding de Supabase para mantener compatibilidad
    return data.map(p => ({
      ...p,
      categoria_nombre: p.categorias?.nombre || null,
      marca_nombre: p.marcas?.nombre || null,
      precio_unitario: Number(p.precio_base),
      categorias: undefined,
      marcas: undefined
    }));
  }

  async findProductById(id: string) {
    this.logger.log(`Buscando producto por ID: ${id}`);
    
    const { data, error } = await this.supabaseClient
      .from('productos')
      .select(`
        *,
        categorias (nombre),
        marcas (nombre)
      `)
      .eq('id_producto', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al buscar producto ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Error al buscar producto: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return {
      ...data,
      categoria_nombre: data.categorias?.nombre || null,
      marca_nombre: data.marcas?.nombre || null,
      precio_unitario: Number(data.precio_base), // Mapeo requerido por ms-sales
      categorias: undefined,
      marcas: undefined
    };
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    this.logger.log(`Actualizando producto ID: ${id}`);
    
    // Validar si existe primero
    await this.findProductById(id);

    const { data, error } = await this.supabaseClient
      .from('productos')
      .update({
        id_categoria: updateProductDto.id_categoria,
        id_marca: updateProductDto.id_marca,
        codigo_barras: updateProductDto.codigo_barras,
        nombre: updateProductDto.nombre,
        precio_base: updateProductDto.precio_base,
        estado: updateProductDto.estado,
      })
      .eq('id_producto', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error al actualizar producto ${id}: ${error.message}`);
      throw new BadRequestException(`No se pudo actualizar el producto: ${error.message}`);
    }

    this.rabbitClient.emit('ProductUpdated', data);
    return {
      message: 'Producto actualizado exitosamente',
      product: {
        ...data,
        precio_unitario: Number(data.precio_base)
      }
    };
  }

  async deleteProduct(id: string) {
    this.logger.log(`Eliminando producto ID: ${id}`);
    
    const product = await this.findProductById(id);

    const { error } = await this.supabaseClient
      .from('productos')
      .delete()
      .eq('id_producto', id);

    if (error) {
      this.logger.error(`Error al eliminar producto ${id}: ${error.message}`);
      throw new InternalServerErrorException(`No se pudo eliminar el producto: ${error.message}`);
    }

    this.rabbitClient.emit('ProductDeleted', { id_producto: id, info: product });
    return { message: `Producto con ID ${id} eliminado correctamente` };
  }

  async findAllCategories() {
    this.logger.log('Consultando categorías de productos...');
    const { data, error } = await this.supabaseClient
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar categorías: ${error.message}`);
      throw new InternalServerErrorException(`Error al obtener categorías: ${error.message}`);
    }
    return data;
  }
}