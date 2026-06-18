import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Pool } from 'pg'; 
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  private pool: Pool;

  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
      throw new Error('Faltan las variables de entorno de la base de datos en ms-product');
    }
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 6543}/${process.env.DB_NAME || 'postgres'}`;
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false, 
      },
    });
  }

  async createProduct(createProductDto: CreateProductDto) {
    const { id_categoria, id_marca, codigo_barras, nombre, precio_base, estado } = createProductDto;
    try {
      const query = `
        INSERT INTO public.productos (id_categoria, id_marca, codigo_barras, nombre, precio_base, estado)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `;
      const res = await this.pool.query(query, [
        id_categoria,
        id_marca,
        codigo_barras,
        nombre,
        precio_base,
        estado || 'activo'
      ]);
      const data = res.rows[0];

      this.rabbitClient.emit('ProductCreated', data);
      return { message: 'Producto creado exitosamente', product: data };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllProducts() {
    try {
      const query = `
        SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
        FROM public.productos p
        LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN public.marcas m ON p.id_marca = m.id_marca;
      `;
      const res = await this.pool.query(query);
      return res.rows;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async findProductById(id: string) {
    try {
      const query = `
        SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
        FROM public.productos p
        LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN public.marcas m ON p.id_marca = m.id_marca
        WHERE p.id_producto = $1;
      `;
      const res = await this.pool.query(query, [id]);
      if (res.rows.length === 0) throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      return res.rows[0];
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    try {
      const { id_categoria, id_marca, codigo_barras, nombre, precio_base, estado } = updateProductDto;
      const query = `
        UPDATE public.productos 
        SET id_categoria = COALESCE($1, id_categoria), 
            id_marca = COALESCE($2, id_marca), 
            codigo_barras = COALESCE($3, codigo_barras), 
            nombre = COALESCE($4, nombre), 
            precio_base = COALESCE($5, precio_base), 
            estado = COALESCE($6, estado)
        WHERE id_producto = $7 RETURNING *;
      `;
      const res = await this.pool.query(query, [id_categoria, id_marca, codigo_barras, nombre, precio_base, estado, id]);
      if (res.rows.length === 0) throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      
      this.rabbitClient.emit('ProductUpdated', res.rows[0]);
      return { message: 'Producto actualizado exitosamente', product: res.rows[0] };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await this.findProductById(id);
      await this.pool.query('DELETE FROM public.productos WHERE id_producto = $1', [id]);
      
      this.rabbitClient.emit('ProductDeleted', { id_producto: id, info: product });
      return { message: `Producto con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllCategories() {
    try {
      const res = await this.pool.query('SELECT * FROM public.categorias;');
      return res.rows;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}