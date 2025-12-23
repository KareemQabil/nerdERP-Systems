import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { StoreConfiguration, ConfigType } from '../entities/store-configuration.entity';

/**
 * Store Configuration Service
 * Provides methods to read and write store-level configuration
 * Replaces hardcoded business logic checks with dynamic configuration lookups
 */
@Injectable()
export class StoreConfigurationService {
    constructor(
        @InjectRepository(StoreConfiguration)
        private readonly configRepo: Repository<StoreConfiguration>,
    ) { }

    /**
     * Get configuration value with default fallback
     * @param storeId Store UUID
     * @param key Configuration key (e.g., 'inventory.allow_negative_stock')
     * @param defaultValue Fallback value if config not found
     * @returns Configuration value or default
     */
    async getConfig<T = any>(
        storeId: string,
        key: string,
        defaultValue: T,
    ): Promise<T> {
        const config = await this.configRepo.findOne({
            where: { store: { id: storeId }, configKey: key },
        });

        return config ? config.configValue : defaultValue;
    }

    /**
     * Get boolean configuration
     * Handles both simple boolean values and { enabled: true } objects
     * @param storeId Store UUID
     * @param key Configuration key
     * @param defaultValue Default boolean value
     * @returns Boolean configuration value
     */
    async getBooleanConfig(
        storeId: string,
        key: string,
        defaultValue = false,
    ): Promise<boolean> {
        const value = await this.getConfig(storeId, key, defaultValue);

        // Handle { enabled: true } format
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
            return (value as { enabled: boolean }).enabled;
        }

        return Boolean(value);
    }

    /**
     * Get number configuration
     * @param storeId Store UUID
     * @param key Configuration key
     * @param defaultValue Default number value
     * @returns Number configuration value
     */
    async getNumberConfig(
        storeId: string,
        key: string,
        defaultValue = 0,
    ): Promise<number> {
        const value = await this.getConfig(storeId, key, defaultValue);
        return Number(value);
    }

    /**
     * Set or update configuration
     * Uses upsert to avoid duplicate key errors
     * @param storeId Store UUID
     * @param key Configuration key
     * @param value Configuration value
     * @param type Configuration type
     * @param category Configuration category
     * @param description Optional description
     */
    @Transactional()
    async setConfig(
        storeId: string,
        key: string,
        value: any,
        type: ConfigType,
        category: string,
        description?: string,
    ): Promise<void> {
        await this.configRepo.upsert(
            {
                store: { id: storeId } as any,
                configKey: key,
                configValue: value,
                configType: type,
                category,
                description,
            },
            ['store', 'configKey'],
        );
    }

    /**
     * Get all configurations for a store
     * @param storeId Store UUID
     * @param category Optional category filter
     * @returns List of configurations
     */
    async getAllConfigs(
        storeId: string,
        category?: string,
    ): Promise<StoreConfiguration[]> {
        const query = this.configRepo
            .createQueryBuilder('config')
            .where('config.store_id = :storeId', { storeId });

        if (category) {
            query.andWhere('config.category = :category', { category });
        }

        return await query.getMany();
    }

    /**
     * Delete configuration
     * @param storeId Store UUID
     * @param key Configuration key
     */
    @Transactional()
    async deleteConfig(storeId: string, key: string): Promise<void> {
        await this.configRepo.delete({
            store: { id: storeId },
            configKey: key,
        });
    }
}
