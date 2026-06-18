import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activar las validaciones de tus DTOs globalmente (Requisito: Validaciones)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 2. Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sales Service - ERP Supermercado')
    .setDescription(
      'API para la gestión de ventas, pagos y comprobantes (Grupo 10)',
    )
    .setVersion('1.0')
    .addBearerAuth() // Permite probar el JWT desde la interfaz de Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3001);
  console.log(
    `🚀 Sales Service corriendo en puerto ${process.env.PORT || 3001}`,
  );
  console.log(
    `📚 Documentación Swagger en: http://localhost:${process.env.PORT || 3001}/api/docs`,
  );
}
bootstrap();
