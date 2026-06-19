import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Deshabilitamos bodyParser para que el proxy pueda retransmitir los flujos (streams) de datos de forma directa
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  
  // Habilitamos CORS para que el frontend pueda consultar sin problemas
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en http://localhost:${port}`);
}
bootstrap();
