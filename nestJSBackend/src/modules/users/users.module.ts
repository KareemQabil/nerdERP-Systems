import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Role, AuditLog } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { PinAttempt } from './entities/pin-attempt.entity';
import { UserService } from './services/user.service';
import { DeviceService } from './services/device.service';
import { UserController, RoleController, AuthController } from './controllers/user.controller';
import { DeviceController } from './controllers/device.controller';
import { PinVerificationController } from './controllers/pin-verification.controller';
import { AuditController } from './controllers/audit.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Role,
            AuditLog,
            Device,
            PinAttempt,
        ]),
    ],
    controllers: [UserController, RoleController, AuthController, DeviceController, PinVerificationController, AuditController],
    providers: [UserService, DeviceService],
    exports: [UserService, DeviceService, TypeOrmModule],
})
export class UsersModule { }
