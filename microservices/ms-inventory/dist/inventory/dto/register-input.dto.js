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
exports.RegisterInputDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterInputDto {
    id_sucursal;
    id_producto;
    cantidad;
}
exports.RegisterInputDto = RegisterInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID de la sucursal de destino',
        example: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'El id_sucursal debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_sucursal no puede estar vacío.' }),
    __metadata("design:type", String)
], RegisterInputDto.prototype, "id_sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID del producto',
        example: 'b901a1c9-7323-4c91-bf9b-3a52e72bc13d',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'El id_producto debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_producto no puede estar vacío.' }),
    __metadata("design:type", String)
], RegisterInputDto.prototype, "id_producto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cantidad de existencias a ingresar',
        example: 10,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La cantidad debe ser un número.' }),
    (0, class_validator_1.IsPositive)({ message: 'La cantidad debe ser mayor a 0.' }),
    __metadata("design:type", Number)
], RegisterInputDto.prototype, "cantidad", void 0);
//# sourceMappingURL=register-input.dto.js.map