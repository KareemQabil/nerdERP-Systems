import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CustomFieldService } from '../services/custom-field.service';
import { CreateCustomFieldDto } from '../dto/create-custom-field.dto';
import { EntityType } from '../entities/custom-field-definition.entity';

@Controller('api/custom-fields')
export class CustomFieldController {
    constructor(private readonly customFieldService: CustomFieldService) { }

    @Get()
    async findAll(@Query('entityType') entityType?: EntityType) {
        let fields;
        if (entityType) {
            fields = await this.customFieldService.getFieldsForEntity(entityType);
        } else {
            fields = await this.customFieldService.findAll();
        }

        return {
            success: true,
            data: fields,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const field = await this.customFieldService.findById(id);
        return {
            success: true,
            data: field,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateCustomFieldDto) {
        const field = await this.customFieldService.create(dto);
        return {
            success: true,
            data: field,
            messageKey: 'CUSTOM_FIELD_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<CreateCustomFieldDto>,
    ) {
        const field = await this.customFieldService.update(id, updateData);
        return {
            success: true,
            data: field,
            messageKey: 'CUSTOM_FIELD_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.customFieldService.delete(id);
    }
}
