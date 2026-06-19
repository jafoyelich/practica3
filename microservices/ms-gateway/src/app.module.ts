import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const salesUrl = this.configService.get<string>('MS_SALES_URL') || 'http://localhost:3001';
    const customerUrl = this.configService.get<string>('MS_CUSTOMER_URL') || 'http://localhost:3002';
    const inventoryUrl = this.configService.get<string>('MS_INVENTORY_URL') || 'http://localhost:3003';
    const notificationUrl = this.configService.get<string>('MS_NOTIFICATION_URL') || 'http://localhost:3004';
    const productUrl = this.configService.get<string>('MS_PRODUCT_URL') || 'http://localhost:3005';

    // Función auxiliar para registrar proxies con control de errores personalizado
    const registerProxy = (prefix: string, targetUrl: string) => {
      consumer
        .apply(
          createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            onError: (err, req, res: any) => {
              if (!res.headersSent) {
                res.writeHead(502, {
                  'Content-Type': 'application/json',
                });
              }
              res.end(
                JSON.stringify({
                  statusCode: 502,
                  message: `Bad Gateway: El microservicio '${prefix}' no responde en la URL: ${targetUrl}`,
                  error: err.message,
                }),
              );
            },
          }),
        )
        .forRoutes(
          { path: prefix, method: RequestMethod.ALL },
          { path: `${prefix}/*path`, method: RequestMethod.ALL },
        );
    };

    registerProxy('sales', salesUrl);
    registerProxy('customers', customerUrl);
    registerProxy('inventory', inventoryUrl);
    registerProxy('notifications', notificationUrl);
    registerProxy('products', productUrl);
  }
}
