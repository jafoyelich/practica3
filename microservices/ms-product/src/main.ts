import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configurar global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 2. Configurar Swagger OpenAPI docs
  const config = new DocumentBuilder()
    .setTitle('Product Service (ms-product)')
    .setDescription('ERP Product Catalog and Inventory Categories Management Microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3004; // ms-sales: 3001, ms-customer: 3002, ms-inventory: 3003, ms-product: 3004
  await app.listen(port);
  console.log(`ms-product REST API corriendo en http://localhost:${port}`);
  console.log(`ms-product Swagger docs corriendo en http://localhost:${port}/api/docs`);
}
bootstrap();
