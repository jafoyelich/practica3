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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSaleDto = exports.SaleDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SaleDetailDto {
    id_producto;
    cantidad;
}
exports.SaleDetailDto = SaleDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID v4 del producto',
        example: 'd3b07384-d113-4956-a534-7c30161472e3',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'El id_producto debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_producto no puede estar vacío.' }),
    __metadata("design:type", String)
], SaleDetailDto.prototype, "id_producto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cantidad de producto a comprar',
        example: 3,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La cantidad debe ser un número.' }),
    (0, class_validator_1.IsPositive)({ message: 'La cantidad debe ser mayor a 0.' }),
    __metadata("design:type", Number)
], SaleDetailDto.prototype, "cantidad", void 0);
class CreateSaleDto {
    tipo_pago;
    id_sucursal;
    id_cliente;
    detalles;
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Método o tipo de pago empleado (e.g. EFECTIVO, QR, TARJETA)',
        example: 'EFECTIVO',
    }),
    (0, class_validator_1.IsString)({ message: 'El tipo_pago debe ser un texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo_pago es obligatorio.' }),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "tipo_pago", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID v4 de la sucursal donde se realiza la venta',
        example: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'El id_sucursal debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_sucursal no puede estar vacío.' }),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "id_sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID v4 del cliente que realiza la compra',
        example: 'fa821102-1234-5678-abcd-ef0123456789',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'El id_cliente debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_cliente no puede estar vacío.' }),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "id_cliente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Listado de detalles de la venta',
        type: [SaleDetailDto],
    }),
    (0, class_validator_1.IsArray)({ message: 'Los detalles deben ser un arreglo.' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'El arreglo de detalles no puede estar vacío.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaleDetailDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "detalles", void 0);
//# sourceMappingURL=create-sale.dto.js.map