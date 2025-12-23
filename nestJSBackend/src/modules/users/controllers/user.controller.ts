import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, CreateRoleDto, UpdateRoleDto, LoginDto, PinLoginDto } from '../dto/user.dto';

@Controller('api/v1/users')
@ApiTags('Users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'Users retrieved' })
    async findAll() {
        const users = await this.userService.findAll();
        return {
            success: true,
            data: users,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        return {
            success: true,
            data: user,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @ApiOperation({ summary: 'Create new user' })
    @ApiResponse({ status: 201, description: 'User created' })
    async create(@Body() dto: CreateUserDto) {
        const user = await this.userService.create(dto);
        return {
            success: true,
            data: user,
            messageKey: 'USER_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'User updated' })
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        const user = await this.userService.update(id, dto);
        return {
            success: true,
            data: user,
            messageKey: 'USER_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    async delete(@Param('id') id: string) {
        await this.userService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'USER_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id/audit-logs')
    @ApiOperation({ summary: 'Get audit logs for user' })
    async getAuditLogs(@Param('id') id: string) {
        const logs = await this.userService.getAuditLogs('User', id);
        return {
            success: true,
            data: logs,
            timestamp: new Date().toISOString(),
        };
    }
}

@Controller('api/v1/roles')
@ApiTags('Roles')
export class RoleController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @ApiOperation({ summary: 'Get all roles' })
    async findAll() {
        const roles = await this.userService.findAllRoles();
        return {
            success: true,
            data: roles,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    async findOne(@Param('id') id: string) {
        const role = await this.userService.findRoleById(id);
        return {
            success: true,
            data: role,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @ApiOperation({ summary: 'Create new role' })
    async create(@Body() dto: CreateRoleDto) {
        const role = await this.userService.createRole(dto);
        return {
            success: true,
            data: role,
            messageKey: 'ROLE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update role' })
    async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        const role = await this.userService.updateRole(id, dto);
        return {
            success: true,
            data: role,
            messageKey: 'ROLE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete role' })
    async delete(@Param('id') id: string) {
        await this.userService.deleteRole(id);
        return {
            success: true,
            data: null,
            messageKey: 'ROLE_DELETED',
            timestamp: new Date().toISOString(),
        };
    }
}

@Controller('api/v1/auth')
@ApiTags('Authentication')
export class AuthController {
    constructor(private readonly userService: UserService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto) {
        const user = await this.userService.validateUser(dto.email, dto.password);
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'AUTH_001',
                    message: 'Invalid credentials',
                },
                timestamp: new Date().toISOString(),
            };
        }

        // Note: In production, generate JWT token here
        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roleId: user.roleId,
                },
                // token: 'jwt-token-here'
            },
            timestamp: new Date().toISOString(),
        };
    }

    @Post('pin-login')
    @ApiOperation({ summary: 'Quick login with PIN code (POS)' })
    async pinLogin(@Body() dto: PinLoginDto) {
        const user = await this.userService.validatePin(dto.pinCode, dto.deviceId);
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'AUTH_006',
                    message: 'Invalid PIN code',
                },
                timestamp: new Date().toISOString(),
            };
        }

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roleId: user.roleId,
                },
            },
            timestamp: new Date().toISOString(),
        };
    }
}
