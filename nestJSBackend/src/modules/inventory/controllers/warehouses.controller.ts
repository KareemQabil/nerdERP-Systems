import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WarehousesService } from '../services/warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/create-warehouse.dto';
import { Warehouse } from '../entities/warehouse.entity';

@Controller('warehouses')
export class WarehousesController {
    constructor(private readonly warehousesService: WarehousesService) { }

    @Post()
    create(@Body() createDto: CreateWarehouseDto): Promise<Warehouse> {
        return this.warehousesService.create(createDto);
    }

    @Get()
    findAll(): Promise<Warehouse[]> {
        return this.warehousesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Warehouse> {
        return this.warehousesService.findById(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateWarehouseDto,
    ): Promise<Warehouse> {
        return this.warehousesService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.warehousesService.remove(id);
    }
}
