import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './controllers/config.controller';
import { ConfigInitService } from './services/config-init.service';
import { ConfigGateway } from './config.gateway';
import { Translation, SupportedLanguage } from '../translations/entities/translation.entity';
import { StoreConfiguration } from '../organization/entities/store-configuration.entity';

/**
 * Config Module
 * Provides configuration initialization and real-time updates
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Translation,
            SupportedLanguage,
            StoreConfiguration,
        ]),
    ],
    controllers: [ConfigController],
    providers: [ConfigInitService, ConfigGateway],
    exports: [ConfigInitService, ConfigGateway],
})
export class ConfigModule {}
