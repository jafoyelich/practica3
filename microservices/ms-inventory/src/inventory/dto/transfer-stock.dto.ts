import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class TransferStockDto {
  @ApiProperty({
    description: 'UUID de la sucursal de origen',
    example: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370',
  })
  @IsUUID(4, { message: 'El id_sucursal_origen debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_sucursal_origen no puede estar vacío.' })
  id_sucursal_origen: string;

  @ApiProperty({
    description: 'UUID de la sucursal de destino',
    example: '4a2a0937-2cfc-4bf0-80d4-1a986c7b3371',
  })
  @IsUUID(4, { message: 'El id_sucursal_destino debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_sucursal_destino no puede estar vacío.' })
  id_sucursal_destino: string;

  @ApiProperty({
    description: 'UUID del producto a transferir',
    example: 'b901a1c9-7323-4c91-bf9b-3a52e72bc13d',
  })
  @IsUUID(4, { message: 'El id_producto debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El id_producto no puede estar vacío.' })
  id_producto: string;

  @ApiProperty({
    description: 'Cantidad a transferir',
    example: 10,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0.' })
  cantidad: number;
}
