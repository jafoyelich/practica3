import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({
    description: 'NIT o Carnet de Identidad del cliente',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nit_ci!: string;

  @ApiProperty({
    description: 'Puntos iniciales de fidelidad acumulados',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntos_acumulados?: number;
}