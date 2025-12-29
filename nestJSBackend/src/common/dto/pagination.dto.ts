import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Standard pagination query parameters
 */
export class PaginationQueryDto {
    @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Page number' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

/**
 * Pagination metadata in response
 */
export class PaginationMetaDto {
    @ApiProperty({ example: 1, description: 'Current page' })
    page: number;

    @ApiProperty({ example: 20, description: 'Items per page' })
    limit: number;

    @ApiProperty({ example: 150, description: 'Total items' })
    total: number;

    @ApiProperty({ example: 8, description: 'Total pages' })
    totalPages: number;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ isArray: true })
    data: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    @ApiProperty({ example: '2025-12-28T00:00:00.000Z' })
    timestamp: string;

    static success<T>(
        data: T[],
        meta: { page: number; limit: number; total: number; totalPages: number }
    ): PaginatedResponseDto<T> {
        return {
            success: true,
            data,
            meta,
            timestamp: new Date().toISOString(),
        };
    }
}
