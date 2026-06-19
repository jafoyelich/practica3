import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo producto en el catálogo' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos del producto inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) createProductDto: CreateProductDto,
  ) {
    return await this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el listado completo de todos los productos' })
  @ApiResponse({ status: 200, description: 'Listado devuelto con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAll() {
    return await this.productService.findAllProducts();
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Obtener el listado de todas las categorías' })
  @ApiResponse({ status: 200, description: 'Categorías devueltas con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async findAllCategories() {
    return await this.productService.findAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener la información detallada de un producto por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del producto', type: String })
  @ApiResponse({ status: 200, description: 'Producto devuelto con éxito (incluye precio_unitario para ms-sales).' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return await this.productService.findProductById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un producto' })
  @ApiParam({ name: 'id', description: 'UUID del producto', type: String })
  @ApiResponse({ status: 200, description: 'Producto actualizado con éxito.' })
  @ApiResponse({ status: 400, description: 'Datos del producto inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto de forma física' })
  @ApiParam({ name: 'id', description: 'UUID del producto', type: String })
  @ApiResponse({ status: 200, description: 'Producto eliminado con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return await this.productService.deleteProduct(id);
  }
}