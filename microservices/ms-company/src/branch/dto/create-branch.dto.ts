import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateBranchDto {
  @IsUUID('4', { message: 'El id_compania debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_compania es obligatorio.' })
  id_compania!: string;

  @IsUUID('4', { message: 'El id_ciudad debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_ciudad es obligatorio.' })
  id_ciudad!: string;

  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio.' })
  nombre!: string;

  @IsString({ message: 'La direccion debe ser un texto.' })
  @IsNotEmpty({ message: 'La direccion de la sucursal es obligatoria.' })
  direccion!: string;
}
