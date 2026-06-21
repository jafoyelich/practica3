import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre de la compañía es obligatorio.' })
  nombre!: string;
}
