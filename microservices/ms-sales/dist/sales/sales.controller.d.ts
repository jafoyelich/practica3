import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto, req: any): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        data: any;
    }>;
    findAll(): Promise<any[]>;
    getDailyReport(date: string): Promise<{
        fecha: string;
        total_consolidado: number;
        ingresos_por_metodo_pago: {
            tipo_pago: string;
            total: number;
        }[];
    }>;
    findOne(id: string): Promise<any>;
}
