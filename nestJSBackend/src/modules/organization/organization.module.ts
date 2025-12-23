import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Store } from './entities/store.entity';
import { StoreConfiguration } from './entities/store-configuration.entity';
import { TaxProfile, TaxDefinition } from './entities/tax-profile.entity';
import { OrganizationService } from './services/organization.service';
import { StoreService } from './services/store.service';
import { StoreConfigurationService } from './services/store-configuration.service';
import { TaxProfileService } from './services/tax-profile.service';
import { OrganizationController } from './controllers/organization.controller';
import { StoreController } from './controllers/store.controller';
import { TaxProfileController } from './controllers/tax-profile.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Organization, Store, StoreConfiguration, TaxProfile, TaxDefinition]),
    ],
    controllers: [OrganizationController, StoreController, TaxProfileController],
    providers: [
        OrganizationService,
        StoreService,
        StoreConfigurationService,
        TaxProfileService,
    ],
    exports: [
        OrganizationService,
        StoreService,
        StoreConfigurationService,
        TaxProfileService,
    ],
})
export class OrganizationModule { }
