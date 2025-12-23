import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { StoreService } from '../services/store.service';
import { StoreConfigurationService } from '../services/store-configuration.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { SetConfigurationDto } from '../dto/set-configuration.dto';

@Controller('api/stores')
export class StoreController {
    constructor(
        private readonly storeService: StoreService,
        private readonly configService: StoreConfigurationService,
    ) { }

    @Get()
    async findAll(@Query('organizationId') organizationId?: string) {
        const stores = await this.storeService.findAll(organizationId);
        return {
            success: true,
            data: stores,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const store = await this.storeService.findById(id);
        return {
            success: true,
            data: store,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateStoreDto) {
        const store = await this.storeService.create(dto);
        return {
            success: true,
            data: store,
            messageKey: 'STORE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<CreateStoreDto>,
    ) {
        const store = await this.storeService.update(id, updateData);
        return {
            success: true,
            data: store,
            messageKey: 'STORE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.storeService.delete(id);
    }

    // Configuration endpoints

    @Get(':id/configurations')
    async getConfigurations(
        @Param('id') storeId: string,
        @Query('category') category?: string,
    ) {
        const configurations = await this.configService.getAllConfigs(
            storeId,
            category,
        );
        return {
            success: true,
            data: configurations,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id/configurations/:key')
    async getConfiguration(
        @Param('id') storeId: string,
        @Param('key') key: string,
    ) {
        const value = await this.configService.getConfig(storeId, key, null);
        return {
            success: true,
            data: {
                configKey: key,
                configValue: value,
            },
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/configurations')
    @HttpCode(HttpStatus.CREATED)
    async setConfiguration(
        @Param('id') storeId: string,
        @Body() dto: SetConfigurationDto,
    ) {
        await this.configService.setConfig(
            storeId,
            dto.configKey,
            dto.configValue,
            dto.configType,
            dto.category,
            dto.description,
        );

        return {
            success: true,
            messageKey: 'CONFIGURATION_SAVED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id/configurations/:key')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteConfiguration(
        @Param('id') storeId: string,
        @Param('key') key: string,
    ) {
        await this.configService.deleteConfig(storeId, key);
    }
}
