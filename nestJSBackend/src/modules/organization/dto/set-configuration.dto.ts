import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ConfigType } from '../entities/store-configuration.entity';

export class SetConfigurationDto {
    @IsString()
    configKey: string;

    configValue: any;

    @IsEnum(ConfigType)
    configType: ConfigType;

    @IsString()
    category: string;

    @IsString()
    @IsOptional()
    description?: string;
}
