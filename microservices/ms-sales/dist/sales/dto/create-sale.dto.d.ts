export declare class SaleDetailDto {
    id_producto: string;
    cantidad: number;
}
export declare class CreateSaleDto {
    tipo_pago: string;
    id_sucursal: string;
    id_cliente: string;
    detalles: SaleDetailDto[];
}
