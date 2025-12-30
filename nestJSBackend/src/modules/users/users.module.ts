import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Role, AuditLog } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { UserService } from './services/user.service';
import { DeviceService } from './services/device.service';
import { UserController, RoleController, AuthController } from './controllers/user.controller';
import { DeviceController } from './controllers/device.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Role,
            AuditLog,
            Device,
        ]),
    ],
    controllers: [UserController, RoleController, AuthController, DeviceController],
    providers: [UserService, DeviceService],
    exports: [UserService, DeviceService, TypeOrmModule],
})
export class UsersModule { }
