import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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
    .setTitle('Notification Service (ms-notification)')
    .setDescription('ERP Customer Notifications and Logs Management Microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 3. Configurar microservicio híbrido para escuchar eventos de RabbitMQ
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'notification_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // 4. Arrancar microservicio asíncrono y API REST
  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3005; // ms-sales: 3001, ms-customer: 3002, ms-inventory: 3003, ms-product: 3004, ms-notification: 3005
  await app.listen(port);
  console.log(`ms-notification REST API corriendo en http://localhost:${port}`);
  console.log(`ms-notification Swagger docs corriendo en http://localhost:${port}/api/docs`);
}
bootstrap();
