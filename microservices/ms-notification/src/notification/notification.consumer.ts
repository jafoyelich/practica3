import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { Channel, Connection } from 'amqplib';
import { connect } from 'amqplib';
import { SaleCreatedDto } from './dto/sale-created.dto';
import { NotificationService } from './notification.service';


@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);
  private connection?: Connection;
  private channel?: Channel;


  private readonly eventName = 'sale.created';

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitUrl) {
      throw new Error('Missing RABBITMQ_URL');
    }

    const queue = this.configService.get<string>('RABBITMQ_QUEUE') ?? 'notification.sale.created';
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'sales';

    const maxRetries = Number(this.configService.get<string>('RABBITMQ_MAX_RETRIES') ?? '5');

    this.connection = await connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, {
      durable: true,
      // La DLQ puede manejarse fuera; aquí solo registramos y evitamos reintentos infinitos.
    });

    // Routing key igual al evento
    await this.channel.bindQueue(queue, exchange, this.eventName);

    await this.channel.prefetch(1);

    this.logger.log(`Consumer ready. exchange=${exchange} queue=${queue} routingKey=${this.eventName}`);

    this.channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        const content = msg.content.toString('utf-8');

        try {
          const raw = JSON.parse(content);
          const dto = plainToInstance(SaleCreatedDto, raw, { enableImplicitConversion: true });
          await validateOrReject(dto, { whitelist: true, forbidNonWhitelisted: false });

          await this.notificationService.processSaleCreated(dto);

          this.channel?.ack(msg);
        } catch (err: any) {
          this.logger.error(`Error processing message: ${err?.message ?? err}`);

          const retries = Number((msg.properties.headers?.['x-retry'] as any) ?? 0);

          if (retries < maxRetries) {
            // Re-publicar con incremento de contador de reintento.
            const headers = { ...(msg.properties.headers ?? {}), 'x-retry': retries + 1 };

            this.channel?.publish(
              this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'sales',
              this.eventName,
              Buffer.from(content),
              {
                headers,
                persistent: true,
                contentType: msg.properties.contentType,
              },
            );

            this.channel?.ack(msg);
          } else {
            // Se acabó: registrar y evitar loop.
            this.logger.error(`Max retries reached for event=${this.eventName}`);
            this.channel?.ack(msg);
          }
        }
      },
      {
        noAck: false,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore
    }
  }
}

