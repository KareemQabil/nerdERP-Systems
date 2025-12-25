import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedComprehensiveService } from '../services/seed-comprehensive.service';

@Controller('seed')
@ApiTags('Seed Data')
export class SeedController {
    constructor(private readonly seedService: SeedComprehensiveService) { }

    @Post('comprehensive')
    @ApiOperation({
        summary: 'Seed comprehensive test data',
        description: 'Seeds the database with test data matching the frontend mock-pos-data.ts. Will fail if data already exists.'
    })
    @ApiResponse({ status: 201, description: 'Seed completed successfully' })
    @ApiResponse({ status: 500, description: 'Seed failed (data may already exist)' })
    async seedComprehensive() {
        const result = await this.seedService.seed();
        return {
            success: true,
            data: result,
            message: 'Comprehensive seed data created successfully',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('reset')
    @ApiOperation({
        summary: 'Reset and reseed database (DESTRUCTIVE)',
        description: 'WARNING: Clears ALL data and reseeds the database. Use for development only!'
    })
    @ApiResponse({ status: 201, description: 'Database reset and reseeded successfully' })
    async resetAndSeed() {
        const result = await this.seedService.resetAndSeed();
        return {
            success: true,
            data: result,
            message: 'Database reset and reseeded successfully',
            timestamp: new Date().toISOString(),
        };
    }
}
