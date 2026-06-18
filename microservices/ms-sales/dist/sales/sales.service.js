"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const microservices_1 = require("@nestjs/microservices");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let SalesService = SalesService_1 = class SalesService {
    configService;
    httpService;
    rabbitClient;
    supabaseClient;
    logger = new common_1.Logger(SalesService_1.name);
    customerServiceUrl;
    productServiceUrl;
    inventoryServiceUrl;
    constructor(configService, httpService, rabbitClient) {
        this.configService = configService;
        this.httpService = httpService;
        this.rabbitClient = rabbitClient;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
        }
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
            db: {
                schema: 'sales_db',
            },
        });
        this.customerServiceUrl = this.configService.get('CUSTOMER_SERVICE_URL') || 'http://localhost:3001';
        this.productServiceUrl = this.configService.get('PRODUCT_SERVICE_URL') || 'http://localhost:3002';
        this.inventoryServiceUrl = this.configService.get('INVENTORY_SERVICE_URL') || 'http://localhost:3003';
    }
    async validateCustomer(id_cliente, token) {
        const url = `${this.customerServiceUrl}/customers/${id_cliente}`;
        this.logger.log(`Validando cliente en: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            }));
            if (!response.data) {
                throw new common_1.BadRequestException(`El cliente con ID ${id_cliente} no existe.`);
            }
            if (response.data.activo === false || response.data.estado === 'INACTIVO') {
                throw new common_1.BadRequestException(`El cliente con ID ${id_cliente} está inactivo.`);
            }
        }
        catch (error) {
            this.logger.error(`Error al validar cliente ${id_cliente}: ${error.message}`);
            throw new common_1.BadRequestException(`No se pudo validar el cliente. Detalles: ${error.response?.data?.message || error.message}`);
        }
    }
    async getProductPrice(id_producto, token) {
        const url = `${this.productServiceUrl}/products/${id_producto}`;
        this.logger.log(`Obteniendo precio de producto en: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            }));
            if (!response.data) {
                throw new common_1.BadRequestException(`El producto con ID ${id_producto} no existe.`);
            }
            const precio = response.data.precio_unitario ?? response.data.precio;
            if (precio === undefined || precio === null) {
                throw new common_1.InternalServerErrorException(`El precio del producto con ID ${id_producto} no fue devuelto.`);
            }
            return Number(precio);
        }
        catch (error) {
            this.logger.error(`Error al obtener producto ${id_producto}: ${error.message}`);
            throw new common_1.BadRequestException(`No se pudo obtener el precio del producto. Detalles: ${error.response?.data?.message || error.message}`);
        }
    }
    async validateProductStock(id_producto, cantidadRequerida, token) {
        const url = `${this.inventoryServiceUrl}/inventory/${id_producto}/stock`;
        this.logger.log(`Verificando stock de producto en: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            }));
            if (!response.data) {
                throw new common_1.BadRequestException(`El producto con ID ${id_producto} no tiene registro en inventario.`);
            }
            const stockDisponible = response.data.stock ?? response.data.cantidad;
            if (stockDisponible === undefined || stockDisponible === null) {
                throw new common_1.InternalServerErrorException(`El stock del producto con ID ${id_producto} no pudo ser determinado.`);
            }
            if (Number(stockDisponible) < cantidadRequerida) {
                throw new common_1.BadRequestException(`Stock insuficiente para el producto ${id_producto}. Stock disponible: ${stockDisponible}, Requerido: ${cantidadRequerida}`);
            }
        }
        catch (error) {
            this.logger.error(`Error al validar stock de producto ${id_producto}: ${error.message}`);
            throw new common_1.BadRequestException(`Error al validar existencias del producto. Detalles: ${error.response?.data?.message || error.message}`);
        }
    }
    async createSale(createSaleDto, token) {
        let subtotalAcumulado = 0;
        const detallesCalculados = [];
        try {
            this.logger.log(`Iniciando creación de venta para cliente: ${createSaleDto.id_cliente}`);
            await this.validateCustomer(createSaleDto.id_cliente, token);
            for (const detalle of createSaleDto.detalles) {
                const precioUnitario = await this.getProductPrice(detalle.id_producto, token);
                await this.validateProductStock(detalle.id_producto, detalle.cantidad, token);
                const subtotalDetalle = precioUnitario * detalle.cantidad;
                subtotalAcumulado += subtotalDetalle;
                detallesCalculados.push({
                    id_producto: detalle.id_producto,
                    cantidad: detalle.cantidad,
                    precio_unitario_cobrado: precioUnitario,
                    subtotal: subtotalDetalle,
                });
            }
            const total = subtotalAcumulado;
            const { data: ventaDB, error: ventaError } = await this.supabaseClient
                .from('ventas')
                .insert({
                id_sucursal: createSaleDto.id_sucursal,
                id_cliente: createSaleDto.id_cliente,
                subtotal: subtotalAcumulado,
                total: total,
                estado: 'COMPLETADA',
            })
                .select()
                .single();
            if (ventaError) {
                throw new common_1.InternalServerErrorException(`Fallo al registrar la cabecera de la venta en base de datos: ${ventaError.message}`);
            }
            const idVenta = ventaDB.id_venta;
            const detallesInsert = detallesCalculados.map((item) => ({
                id_venta: idVenta,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario_cobrado: item.precio_unitario_cobrado,
                subtotal: item.subtotal,
            }));
            const { error: detallesError } = await this.supabaseClient
                .from('detalle_venta')
                .insert(detallesInsert);
            if (detallesError) {
                this.logger.warn(`Ejecutando rollback manual de la cabecera id_venta: ${idVenta}`);
                await this.supabaseClient.from('ventas').delete().eq('id_venta', idVenta);
                throw new common_1.InternalServerErrorException(`Fallo al registrar los detalles de la venta en base de datos: ${detallesError.message}`);
            }
            const { data: comprobanteDB, error: comprobanteError } = await this.supabaseClient
                .from('comprobantes')
                .insert({
                id_venta: idVenta,
                fecha_emision: new Date().toISOString(),
            })
                .select()
                .single();
            if (comprobanteError) {
                this.logger.warn(`Ejecutando rollback manual completo para id_venta: ${idVenta}`);
                await this.supabaseClient.from('detalle_venta').delete().eq('id_venta', idVenta);
                await this.supabaseClient.from('ventas').delete().eq('id_venta', idVenta);
                throw new common_1.InternalServerErrorException(`Fallo al emitir el comprobante de la venta en base de datos: ${comprobanteError.message}`);
            }
            const completeSalePayload = {
                ...ventaDB,
                detalles: detallesInsert,
                comprobante: comprobanteDB,
            };
            this.rabbitClient.emit('SaleCompleted', completeSalePayload);
            this.logger.log(`Venta creada con éxito y evento 'SaleCompleted' emitido.`);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Venta registrada y comprobante emitido exitosamente.',
                data: completeSalePayload,
            };
        }
        catch (error) {
            this.logger.error(`Fallo crítico al procesar la venta: ${error.message}`);
            const cancelPayload = {
                dto: createSaleDto,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
            this.rabbitClient.emit('SaleCancelled', cancelPayload);
            this.logger.log(`Evento 'SaleCancelled' emitido a RabbitMQ.`);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`No se pudo procesar la venta. Razón: ${error.message}`);
        }
    }
    async findAllSales() {
        this.logger.log('Consultando todas las ventas en Supabase...');
        const { data, error } = await this.supabaseClient
            .from('ventas')
            .select('*')
            .order('fecha', { ascending: false });
        if (error) {
            throw new common_1.InternalServerErrorException(`Error al obtener ventas: ${error.message}`);
        }
        return data;
    }
    async findSaleById(id) {
        this.logger.log(`Consultando detalles de venta por ID: ${id}`);
        const { data, error } = await this.supabaseClient
            .from('ventas')
            .select(`
        *,
        detalle_venta (*),
        comprobantes (*)
      `)
            .eq('id_venta', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                throw new common_1.HttpException(`La venta con ID ${id} no existe.`, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.InternalServerErrorException(`Error al buscar la venta: ${error.message}`);
        }
        return data;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('SALES_SERVICE')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        microservices_1.ClientProxy])
], SalesService);
//# sourceMappingURL=sales.service.js.map