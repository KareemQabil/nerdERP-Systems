import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API success response wrapper
 */
export class ApiResponseDto<T> {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty()
    data: T;

    @ApiPropertyOptional({ example: 'OPERATION_SUCCESS' })
    messageKey?: string;

    @ApiProperty({ example: '2025-12-28T00:00:00.000Z' })
    timestamp: string;

    static success<T>(data: T, messageKey?: string): ApiResponseDto<T> {
        return {
            success: true,
            data,
            messageKey,
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Error details structure
 */
export class ApiErrorDto {
    @ApiProperty({ example: 'MODULE_001' })
    code: string;

    @ApiProperty({ example: 'ERROR_KEY' })
    messageKey: string;

    @ApiProperty({ example: 'Human readable error message' })
    message: string;

    @ApiPropertyOptional()
    details?: any;
}

/**
 * Standard API error response wrapper
 */
export class ApiErrorResponseDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({ type: ApiErrorDto })
    error: ApiErrorDto;

    @ApiProperty({ example: '2025-12-28T00:00:00.000Z' })
    timestamp: string;

    @ApiProperty({ example: '/api/v1/endpoint' })
    path: string;

    static error(
        code: string,
        message: string,
        path: string,
        messageKey = 'ERROR.UNKNOWN',
        details?: any
    ): ApiErrorResponseDto {
        return {
            success: false,
            error: { code, messageKey, message, details },
            timestamp: new Date().toISOString(),
            path,
        };
    }
}
