import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, Min, MaxLength } from 'class-validator';

export class AssignPointsDto {
  @ApiProperty({
    description: 'Cantidad de puntos a asignar',
    example: 50,
  })
  @IsInt()
  @Min(1)
  puntos!: number;

  @ApiProperty({
    description: 'Razón por la cual se otorgan los puntos',
    example: 'Compra de víveres',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  motivo!: string;
}