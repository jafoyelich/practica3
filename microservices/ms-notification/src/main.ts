import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // No se configura bodyParser global porque el consumer RabbitMQ no usa HTTP.
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();


