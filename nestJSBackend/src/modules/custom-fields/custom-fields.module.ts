import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldService } from './services/custom-field.service';
import { CustomFieldController } from './controllers/custom-field.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CustomFieldDefinition])],
    controllers: [CustomFieldController],
    providers: [CustomFieldService],
    exports: [CustomFieldService],
})
export class CustomFieldsModule { }
