"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Inventory Service (ms-inventory)')
        .setDescription('ERP Inventory Stock, Losses, Transfers, and Kardex Management Microservice')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [rabbitUrl],
            queue: 'inventory_queue',
            queueOptions: {
                durable: true,
            },
        },
    });
    await app.startAllMicroservices();
    const port = process.env.PORT ?? 3003;
    await app.listen(port);
    console.log(`ms-inventory REST API corriendo en http://localhost:${port}`);
    console.log(`ms-inventory Swagger docs corriendo en http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map