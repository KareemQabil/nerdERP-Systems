import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data) => {
                // If data is already an ApiResponse (e.g. from a filter or manual return), just return it
                if (data instanceof ApiResponse) {
                    return data;
                }

                return new ApiResponse({
                    success: true,
                    data,
                    messageKey: undefined, // Could be enhanced to support metadata
                });
            }),
        );
    }
}
