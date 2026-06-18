import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsPositive, IsUUID, Min, ValidateNested } from 'class-validator';

export class SaleDetailDto {
  @IsUUID('4')
  id_producto!: string;

  // Se permite descripción como string opcional (si el evento la incluye)
  descripcion?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  cantidad!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  precio_unitario!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  subtotal!: number;
}

export class SaleDetailPayloadDto {
  @IsUUID('4')
  id_producto!: string;

  descripcion?: string;

  @Type(() => Number)
  @IsInt()
  // cantidad suele ser numérico con decimales según DB; aquí aceptamos int para simplicidad.
  // Si deseas permitir decimales, reemplazar IsInt por IsNumber + Min(0).
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  precio_unitario!: number;

  @Type(() => Number)
  @IsNumber()
  subtotal!: number;
}

