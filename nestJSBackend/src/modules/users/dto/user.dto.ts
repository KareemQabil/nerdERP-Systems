import { IsEmail, IsString, IsBoolean, IsOptional, MinLength, Matches, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'john.doe@nerdpos.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: '+966501234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: '1234', description: '4-6 digit PIN for POS quick login', required: false })
    @IsOptional()
    @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
    pinCode?: string;

    @ApiProperty({ example: 'uuid-of-role' })
    @IsUUID()
    roleId: string;

    @ApiProperty({ example: 'uuid-of-store', required: false })
    @IsOptional()
    @IsUUID()
    storeId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateUserDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Matches(/^\d{4,6}$/)
    pinCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    roleId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    storeId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class CreateRoleDto {
    @ApiProperty({ example: 'Store Manager' })
    @IsString()
    roleName: string;

    @ApiProperty({ example: 'MANAGER' })
    @IsString()
    roleCode: string;

    @ApiProperty({ example: ['orders.*', 'inventory.view', 'reports.sales'] })
    permissions: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    parentRoleId?: string;
}

export class UpdateRoleDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    roleName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    permissions?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    parentRoleId?: string;
}

export class CreateDeviceDto {
    @ApiProperty({ example: 'POS Terminal 1' })
    @IsString()
    deviceName: string;

    @ApiProperty({ example: 'POS-001' })
    @IsString()
    deviceCode: string;

    @ApiProperty({ example: 'POS', enum: ['POS', 'KDS', 'KIOSK', 'MOBILE'] })
    @IsString()
    deviceType: string;

    @ApiProperty({ example: 'uuid-of-store' })
    @IsUUID()
    storeId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    hardwareId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    config?: Record<string, any>;
}

export class UpdateDeviceDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    deviceName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    config?: Record<string, any>;
}

export class LoginDto {
    @ApiProperty({ example: 'john.doe@nerdpos.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    password: string;

    @ApiProperty({ example: 'uuid-of-device', required: false })
    @IsOptional()
    @IsUUID()
    deviceId?: string;
}

export class PinLoginDto {
    @ApiProperty({ example: '1234' })
    @Matches(/^\d{4,6}$/)
    pinCode: string;

    @ApiProperty({ example: 'uuid-of-device' })
    @IsUUID()
    deviceId: string;
}
