"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const microservices_1 = require("@nestjs/microservices");
const jwt_1 = require("@nestjs/jwt");
const sales_controller_1 = require("./sales.controller");
const sales_service_1 = require("./sales.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            axios_1.HttpModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') ||
                        'default-jwt-secret-key-erp-supermarket',
                    signOptions: { expiresIn: '24h' },
                }),
            }),
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'SALES_SERVICE',
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [
                                configService.get('RABBITMQ_URL') ||
                                    'amqp://localhost:5672',
                            ],
                            queue: 'sales_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                },
            ]),
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [sales_service_1.SalesService, jwt_auth_guard_1.JwtAuthGuard],
        exports: [sales_service_1.SalesService, jwt_auth_guard_1.JwtAuthGuard, jwt_1.JwtModule],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map