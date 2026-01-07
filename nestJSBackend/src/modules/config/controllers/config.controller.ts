import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ConfigInitService } from '../services/config-init.service';
import { ConfigInitDto, ConfigInitResponse } from '../dto/config-init.dto';

/**
 * Config Controller
 * Public endpoint for fast app initialization
 * No authentication required for GET operations
 */
@ApiTags('Config')
@Controller('config')
export class ConfigController {
    constructor(private readonly configInitService: ConfigInitService) {}

    /**
     * GET /api/config/init
     * Public endpoint - returns complete store configuration
     * Used by frontend on app load
     *
     * @example
     * GET /api/config/init?storeId=123e4567-e89b-12d3-a456-426614174000&languageCode=ar
     */
    @Public() // No auth required
    @Get('init')
    @ApiOperation({
        summary: 'Get complete store configuration',
        description: 'Public endpoint that returns all store configuration including theme, translations, features, taxes, and POS settings. Used by frontend during app initialization.',
    })
    async getConfigInit(@Query() query: ConfigInitDto): Promise<{
        success: true;
        data: ConfigInitResponse;
    }> {
        const config = await this.configInitService.getStoreInitConfig(
            query.storeId,
            query.languageCode || 'ar',
        );

        return {
            success: true,
            data: config,
        };
    }

    /**
     * GET /api/config/init/:storeId
     * Alternative path using store ID in URL
     *
     * @example
     * GET /api/config/init/123e4567-e89b-12d3-a456-426614174000?lang=en
     */
    @Public()
    @Get('init/:storeId')
    @ApiOperation({
        summary: 'Get store config by ID',
        description: 'Alternative endpoint with store ID in URL path instead of query parameter.',
    })
    async getConfigInitByStoreId(
        @Param('storeId') storeId: string,
        @Query('lang') languageCode?: string,
    ): Promise<{
        success: true;
        data: ConfigInitResponse;
    }> {
        const config = await this.configInitService.getStoreInitConfig(
            storeId,
            languageCode || 'ar',
        );

        return {
            success: true,
            data: config,
        };
    }
}
