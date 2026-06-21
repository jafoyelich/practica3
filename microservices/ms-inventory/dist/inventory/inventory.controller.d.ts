import { InventoryService } from './inventory.service';
import { RegisterLossDto } from './dto/register-loss.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { RegisterInputDto } from './dto/register-input.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    loadExcel(file: Express.Multer.File): Promise<{
        message: string;
        filas_procesadas: number;
        data: any[];
    }>;
    getStock(id_producto: string, id_sucursal: string): Promise<{
        id_producto: string;
        id_sucursal: string;
        stock: number;
    }>;
    getConsolidatedStock(id_producto: string): Promise<{
        id_producto: string;
        total: number;
    }>;
    registerInput(dto: RegisterInputDto): Promise<{
        message: string;
        data: any;
    }>;
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
    getKardex(id_sucursal: string): Promise<any[]>;
    handleSaleCompleted(payload: any): Promise<void>;
}
