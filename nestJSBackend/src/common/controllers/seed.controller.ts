import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeedComprehensiveService } from '../services/seed-comprehensive.service';

@Controller('api/v1/seed')
@ApiTags('Seed Data')
export class SeedController {
    constructor(private readonly seedService: SeedComprehensiveService) { }

    @Post('comprehensive')
    @ApiOperation({ summary: 'Seed comprehensive test data' })
    async seedComprehensive() {
        const result = await this.seedService.seed();
        return {
            success: true,
            data: result,
            message: 'Comprehensive seed data created successfully',
            timestamp: new Date().toISOString(),
        };
    }
}
