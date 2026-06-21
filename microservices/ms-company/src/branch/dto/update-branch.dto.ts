import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBranchDto {
  @IsUUID('4', { message: 'El id_compania debe ser un UUID v4 válido.' })
  @IsOptional()
  id_compania?: string;

  @IsUUID('4', { message: 'El id_ciudad debe ser un UUID v4 válido.' })
  @IsOptional()
  id_ciudad?: string;

  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'La direccion debe ser un texto.' })
  @IsNotEmpty({ message: 'La direccion no puede estar vacía.' })
  @IsOptional()
  direccion?: string;
}
