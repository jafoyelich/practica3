import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'UUID de la categoría del producto',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'El id_categoria debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El id_categoria es obligatorio' })
  id_categoria!: string;

  @ApiProperty({
    description: 'UUID de la marca del producto',
    example: 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c',
  })
  @IsUUID('4', { message: 'El id_marca debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El id_marca es obligatorio' })
  id_marca!: string;

  @ApiProperty({
    description: 'Código de barras para escaneo',
    example: '7791234567890',
    required: false,
  })
  @IsString({ message: 'El código de barras debe ser un texto' })
  @IsOptional()
  codigo_barras?: string;

  @ApiProperty({
    description: 'Nombre completo del producto',
    example: 'Arroz Integral 1kg',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre!: string;

  @ApiProperty({
    description: 'Precio base de venta del producto',
    example: 15.50,
  })
  @IsNumber({}, { message: 'El precio_base debe ser un número válido' })
  @Min(0, { message: 'El precio_base no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio_base es obligatorio' })
  precio_base!: number;

  @ApiProperty({
    description: 'Estado actual del producto',
    example: 'activo',
    required: false,
  })
  @IsString({ message: 'El estado debe ser un texto' })
  @IsOptional()
  estado?: string;
}