import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AppModule implements NestModule {
    private readonly configService;
    constructor(configService: ConfigService);
    configure(consumer: MiddlewareConsumer): void;
}
