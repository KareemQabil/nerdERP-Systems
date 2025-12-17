import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'Internal Server Error' };

        let errorObj = {
            code: 'SYS_000', // Default error code
            message: 'Unknown Error',
            messageKey: 'ERROR.UNKNOWN',
            details: null,
        };

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const res = exceptionResponse as any;
            errorObj.message = res.message || (exception as any).message || 'Unknown Error';
            errorObj.code = res.code || (exception as any).code || 'SYS_000'; // Expecting backend to throw custom exceptions with codes
            errorObj.details = res.error || null;
            // You can map 'statusCode' or other props here
        } else if (typeof exceptionResponse === 'string') {
            errorObj.message = exceptionResponse;
        }

        this.logger.error(
            `Http Status: ${status} Error Message: ${JSON.stringify(errorObj)}`,
        );

        const apiResponse = new ApiResponse({
            success: false,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: errorObj,
        });

        response.status(status).json(apiResponse);
    }
}
