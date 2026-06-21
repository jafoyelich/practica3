import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

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
  ci!: string;

  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'juan.perez@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  email?: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente',
    example: '77777777',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({
    description: 'Estado del cliente',
    example: 'ACTIVO',
    required: false,
  })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({
    description: 'Puntos de fidelidad acumulados',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntos?: number;
}