import { IsString, IsNumber, IsUUID, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsUUID('4', { message: 'El id_categoria debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id_categoria es obligatorio' })
  id_categoria!: string;

  @IsUUID('4', { message: 'El id_marca debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id_marca es obligatorio' })
  id_marca!: string;

  @IsString({ message: 'El código de barras debe ser un texto' })
  @IsOptional()
  codigo_barras?: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre!: string;

  @IsNumber({}, { message: 'El precio_base debe ser un número válido' })
  @Min(0, { message: 'El precio_base no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio_base es obligatorio' })
  precio_base!: number;

  @IsString({ message: 'El estado debe ser un texto' })
  @IsOptional()
  estado?: string;
}