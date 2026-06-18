export declare class SaleDetailDto {
    id_producto: string;
    cantidad: number;
}
export declare class CreateSaleDto {
    id_sucursal: string;
    id_cliente: string;
    detalles: SaleDetailDto[];
}
