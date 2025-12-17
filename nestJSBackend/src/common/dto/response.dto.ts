export class ApiResponse<T> {
    success: boolean;
    data?: T;
    messageKey?: string;
    timestamp: string;
    error?: {
        code: string;
        messageKey: string;
        message: string;
        details?: any;
    };
    path?: string;

    constructor(partial: Partial<ApiResponse<T>>) {
        Object.assign(this, partial);
        this.timestamp = new Date().toISOString();
    }
}
