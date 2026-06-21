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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    configure(consumer) {
        const salesUrl = this.configService.get('MS_SALES_URL') || 'http://localhost:3001';
        const customerUrl = this.configService.get('MS_CUSTOMER_URL') || 'http://localhost:3002';
        const inventoryUrl = this.configService.get('MS_INVENTORY_URL') || 'http://localhost:3003';
        const notificationUrl = this.configService.get('MS_NOTIFICATION_URL') || 'http://localhost:3004';
        const productUrl = this.configService.get('MS_PRODUCT_URL') || 'http://localhost:3005';
        const companyUrl = this.configService.get('COMPANY_SERVICE_URL') || 'http://localhost:3006';
        const registerProxy = (prefix, targetUrl) => {
            consumer
                .apply((0, http_proxy_middleware_1.createProxyMiddleware)({
                target: targetUrl,
                changeOrigin: true,
                onError: (err, req, res) => {
                    if (!res.headersSent) {
                        res.writeHead(502, {
                            'Content-Type': 'application/json',
                        });
                    }
                    res.end(JSON.stringify({
                        statusCode: 502,
                        message: `Bad Gateway: El microservicio '${prefix}' no responde en la URL: ${targetUrl}`,
                        error: err.message,
                    }));
                },
            }))
                .forRoutes({ path: prefix, method: common_1.RequestMethod.ALL }, { path: `${prefix}/*path`, method: common_1.RequestMethod.ALL });
        };
        registerProxy('sales', salesUrl);
        registerProxy('customers', customerUrl);
        registerProxy('inventory', inventoryUrl);
        registerProxy('notifications', notificationUrl);
        registerProxy('products', productUrl);
        registerProxy('companies', companyUrl);
        registerProxy('cities', companyUrl);
        registerProxy('branches', companyUrl);
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppModule);
//# sourceMappingURL=app.module.js.map