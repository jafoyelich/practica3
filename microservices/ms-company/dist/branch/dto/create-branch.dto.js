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
exports.CreateBranchDto = void 0;
const class_validator_1 = require("class-validator");
class CreateBranchDto {
    id_compania;
    id_ciudad;
    nombre;
    direccion;
}
exports.CreateBranchDto = CreateBranchDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'El id_compania debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_compania es obligatorio.' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "id_compania", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'El id_ciudad debe ser un UUID v4 válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El id_ciudad es obligatorio.' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "id_ciudad", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser un texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre de la sucursal es obligatorio.' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La direccion debe ser un texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La direccion de la sucursal es obligatoria.' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "direccion", void 0);
//# sourceMappingURL=create-branch.dto.js.map