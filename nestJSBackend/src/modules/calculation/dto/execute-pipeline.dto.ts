import { IsObject } from 'class-validator';

export class ExecutePipelineDto {
    @IsObject()
    context: Record<string, any>;
}
