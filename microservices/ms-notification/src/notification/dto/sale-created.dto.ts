import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SaleDetailPayloadDto } from './detail.dto';

export class SaleCreatedDto {
  @IsUUID('4')
  id_venta!: string;

  @IsUUID('4')
  id_cliente!: string;

  @IsString()
  @IsNotEmpty()
  cliente_nombre!: string;

  @IsEmail()
  cliente_email!: string;

  @IsString()
  @IsNotEmpty()
  cliente_telefono!: string;

  @IsDateString()
  fecha!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;

  @IsString()
  @IsNotEmpty()
  estado!: string;

  @Type(() => Number)
  @IsNumber()
  nro_comprobante!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleDetailPayloadDto)
  detalle!: SaleDetailPayloadDto[];
}

