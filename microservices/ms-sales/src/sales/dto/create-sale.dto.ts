import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ValidateNested, IsNotEmpty, IsNumber, IsPositive, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleDetailDto {
  @ApiProperty({
    description: 'UUID v4 del producto',
    example: 'd3b07384-d113-4956-a534-7c30161472e3',
  })
  @IsUUID(4, { message: 'El id_producto debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_producto no puede estar vacío.' })
  id_producto: string;

  @ApiProperty({
    description: 'Cantidad de producto a comprar',
    example: 3,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0.' })
  cantidad: number;
}

export class CreateSaleDto {
  @ApiProperty({
    description: 'UUID v4 de la sucursal donde se realiza la venta',
    example: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370',
  })
  @IsUUID(4, { message: 'El id_sucursal debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_sucursal no puede estar vacío.' })
  id_sucursal: string;

  @ApiProperty({
    description: 'UUID v4 del cliente que realiza la compra',
    example: 'fa821102-1234-5678-abcd-ef0123456789',
  })
  @IsUUID(4, { message: 'El id_cliente debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_cliente no puede estar vacío.' })
  id_cliente: string;

  @ApiProperty({
    description: 'Listado de detalles de la venta',
    type: [SaleDetailDto],
  })
  @IsArray({ message: 'Los detalles deben ser un arreglo.' })
  @ArrayNotEmpty({ message: 'El arreglo de detalles no puede estar vacío.' })
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  detalles: SaleDetailDto[];
}
