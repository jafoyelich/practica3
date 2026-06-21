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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const microservices_1 = require("@nestjs/microservices");
const platform_express_1 = require("@nestjs/platform-express");
const inventory_service_1 = require("./inventory.service");
const register_loss_dto_1 = require("./dto/register-loss.dto");
const transfer_stock_dto_1 = require("./dto/transfer-stock.dto");
const register_input_dto_1 = require("./dto/register-input.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async loadExcel(file) {
        if (!file) {
            throw new common_1.BadRequestException('Archivo Excel no proporcionado.');
        }
        return await this.inventoryService.loadExcel(file.buffer);
    }
    async getStock(id_producto, id_sucursal) {
        const stock = await this.inventoryService.getProductStock(id_producto, id_sucursal);
        return { id_producto, id_sucursal, stock };
    }
    async getConsolidatedStock(id_producto) {
        const total = await this.inventoryService.getConsolidatedStock(id_producto);
        return { id_producto, total };
    }
    async registerInput(dto) {
        return await this.inventoryService.registerInput(dto);
    }
    async registerLoss(dto) {
        return await this.inventoryService.registerLoss(dto);
    }
    async transferStock(dto) {
        return await this.inventoryService.transferStock(dto);
    }
    async getKardex(id_sucursal) {
        return await this.inventoryService.getKardexHistory(id_sucursal);
    }
    async handleSaleCompleted(payload) {
        await this.inventoryService.handleSaleCompletedEvent(payload);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('load_excel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Cargar stock inicial e ingresos desde un archivo Excel' }),
    (0, swagger_1.ApiBody)({
        description: 'Archivo Excel con columnas: id_sucursal, id_producto, cantidad',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Stock cargado con éxito e ingresos registrados.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Archivo inválido o datos mal formados.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error interno del servidor.' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "loadExcel", null);
__decorate([
    (0, common_1.Get)(':id_producto/stock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar el stock disponible de un producto en una sucursal' }),
    (0, swagger_1.ApiParam)({ name: 'id_producto', description: 'UUID del producto', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'id_sucursal', description: 'UUID de la sucursal', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cantidad de stock disponible.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error interno del servidor.' }),
    __param(0, (0, common_1.Param)('id_producto', new common_1.ParseUUIDPipe({ version: '4' }))),
    __param(1, (0, common_1.Query)('id_sucursal', new common_1.ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStock", null);
__decorate([
    (0, common_1.Get)('balance/:id_producto/consolidated'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar el stock consolidado total de un producto en todas las sucursales' }),
    (0, swagger_1.ApiParam)({ name: 'id_producto', description: 'UUID del producto', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cantidad total consolidada.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    __param(0, (0, common_1.Param)('id_producto', new common_1.ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getConsolidatedStock", null);
__decorate([
    (0, common_1.Post)('input'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar un ingreso de inventario individual manual' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Ingreso registrado con éxito y Kardex anotado.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parámetros inválidos.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true, whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_input_dto_1.RegisterInputDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "registerInput", null);
__decorate([
    (0, common_1.Post)('loss'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar una baja de inventario por merma o vencimiento' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Merma registrada con éxito y egreso anotado en Kardex.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Stock insuficiente o parámetros inválidos.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error interno del servidor.' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true, whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_loss_dto_1.RegisterLossDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "registerLoss", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Transferir existencias entre sucursales' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transferencia realizada con éxito y movimientos asentados en Kardex.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Stock insuficiente en origen o parámetros inválidos.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error interno del servidor.' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true, whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_stock_dto_1.TransferStockDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "transferStock", null);
__decorate([
    (0, common_1.Get)('kardex/:id_sucursal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar el historial del Kardex de una sucursal' }),
    (0, swagger_1.ApiParam)({ name: 'id_sucursal', description: 'UUID de la sucursal', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Historial de movimientos devuelto con éxito.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error interno del servidor.' }),
    __param(0, (0, common_1.Param)('id_sucursal', new common_1.ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getKardex", null);
__decorate([
    (0, microservices_1.EventPattern)('SaleCompleted'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "handleSaleCompleted", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map