"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const branch_controller_1 = require("./branch.controller");
const branch_service_1 = require("./branch.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let BranchModule = class BranchModule {
};
exports.BranchModule = BranchModule;
exports.BranchModule = BranchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'default-jwt-secret-key-erp-supermarket',
                    signOptions: { expiresIn: '24h' },
                }),
            }),
        ],
        controllers: [branch_controller_1.BranchController],
        providers: [branch_service_1.BranchService, jwt_auth_guard_1.JwtAuthGuard],
        exports: [branch_service_1.BranchService, jwt_auth_guard_1.JwtAuthGuard, jwt_1.JwtModule],
    })
], BranchModule);
//# sourceMappingURL=branch.module.js.map