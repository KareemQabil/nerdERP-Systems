import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook, WebhookLog } from './entities/webhook.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Webhook,
            WebhookLog,
        ]),
    ],
    providers: [],
    exports: [],
})
export class WebhooksModule { }
