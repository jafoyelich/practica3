import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('products')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get('products')
  findAll() {
    return this.productService.findAllProducts();
  }

  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.productService.findProductById(id);
  }

  @Put('products/:id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  remove(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Get('categories')
  findAllCategories() {
    return this.productService.findAllCategories();
  }
}