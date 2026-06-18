import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  // 2. Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Customer Service (ms-customer)')
    .setDescription('ERP Customer Loyalty and Profiles Management Microservice')
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
      queue: 'customer_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // 4. Iniciar microservicio asíncrono y API REST
  await app.startAllMicroservices();
  
  const port = process.env.PORT ?? 3002; // ms-sales corre en 3001, ms-customer en 3002
  await app.listen(port);
  console.log(`ms-customer REST API corriendo en http://localhost:${port}`);
  console.log(`ms-customer Swagger docs corriendo en http://localhost:${port}/api/docs`);
}
bootstrap();
