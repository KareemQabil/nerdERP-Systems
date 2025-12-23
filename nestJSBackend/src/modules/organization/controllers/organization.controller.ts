import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Controller('api/organizations')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) { }

    @Get()
    async findAll() {
        const organizations = await this.organizationService.findAll();
        return {
            success: true,
            data: organizations,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const organization = await this.organizationService.findById(id);
        return {
            success: true,
            data: organization,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateOrganizationDto) {
        const organization = await this.organizationService.create(dto);
        return {
            success: true,
            data: organization,
            messageKey: 'ORGANIZATION_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<CreateOrganizationDto>,
    ) {
        const organization = await this.organizationService.update(id, updateData);
        return {
            success: true,
            data: organization,
            messageKey: 'ORGANIZATION_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.organizationService.delete(id);
    }
}
