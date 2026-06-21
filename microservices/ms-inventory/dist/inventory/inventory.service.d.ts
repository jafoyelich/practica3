import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterLossDto } from './dto/register-loss.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
export declare class InventoryService {
    private readonly configService;
    private readonly rabbitClient;
    private readonly supabaseClient;
    private readonly logger;
    constructor(configService: ConfigService, rabbitClient: ClientProxy);
    loadExcel(fileBuffer: Buffer): Promise<{
        message: string;
        filas_procesadas: number;
        data: any[];
    }>;
    getProductStock(id_producto: string, id_sucursal: string): Promise<number>;
    registerLoss(dto: RegisterLossDto): Promise<{
        message: string;
        id_producto: string;
        id_sucursal: string;
        saldo_restante: number;
        kardex: any;
    }>;
    transferStock(dto: TransferStockDto): Promise<{
        message: string;
        id_producto: string;
        sucursal_origen: {
            id: string;
            saldo: number;
        };
        sucursal_destino: {
            id: string;
            saldo: number;
        };
    }>;
    getKardexHistory(id_sucursal: string): Promise<any[]>;
    handleSaleCompletedEvent(payload: any): Promise<void>;
    getConsolidatedStock(id_producto: string): Promise<number>;
    registerInput(dto: {
        id_sucursal: string;
        id_producto: string;
        cantidad: number;
    }): Promise<{
        message: string;
        data: any;
    }>;
}
