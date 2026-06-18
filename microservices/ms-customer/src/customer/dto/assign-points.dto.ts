import {
  IsInt,
  IsString,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';

export class AssignPointsDto {
  @IsInt()
  @Min(1)
  puntos!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  motivo!: string;
}