import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private readonly configService;
    private readonly httpService;
    private readonly rabbitClient;
    private readonly supabaseClient;
    private readonly logger;
    private readonly customerServiceUrl;
    private readonly productServiceUrl;
    private readonly inventoryServiceUrl;
    constructor(configService: ConfigService, httpService: HttpService, rabbitClient: ClientProxy);
    private validateCustomer;
    private getProductPrice;
    private validateProductStock;
    createSale(createSaleDto: CreateSaleDto, token: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    findAllSales(): Promise<any[]>;
    findSaleById(id: string): Promise<any>;
}
