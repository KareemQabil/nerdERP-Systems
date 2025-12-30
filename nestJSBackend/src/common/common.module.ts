import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../modules/users/entities/user.entity';
import { AuditLogService } from './services/audit-log.service';

/**
 * Common Module
 * 
 * Provides shared services that can be used across all modules.
 * Marked as @Global() so services don't need to be imported in every module.
 */
@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([AuditLog]),
    ],
    providers: [AuditLogService],
    exports: [AuditLogService, TypeOrmModule],
})
export class CommonModule { }
