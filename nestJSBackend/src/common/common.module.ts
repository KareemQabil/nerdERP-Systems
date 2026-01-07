import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../modules/users/entities/user.entity';
import { Translation, SupportedLanguage } from '../modules/translations/entities/translation.entity';
import { AuditLogService } from './services/audit-log.service';
import { PinHashService } from './services/pin-hash.service';

/**
 * Common Module
 *
 * Provides shared services that can be used across all modules.
 * Marked as @Global() so services don't need to be imported in every module.
 */
@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([AuditLog, Translation, SupportedLanguage]),
    ],
    providers: [AuditLogService, PinHashService],
    exports: [AuditLogService, PinHashService, TypeOrmModule],
})
export class CommonModule { }
