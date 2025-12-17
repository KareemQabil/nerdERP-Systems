# NestJS ERP System - Comprehensive Development Guide with Transaction Management

## Project Overview

Building a production-ready NestJS TypeScript ERP system with PostgreSQL, following clean architecture principles with **Generic Repository and Generic Service patterns**, **Domain-Driven Design**, **Transaction Management using typeorm-transactional**, and strict separation of concerns.

---

## 🎯 PHASE 1: Project Foundation & Configuration with Transaction Support

### Objective

Initialize the NestJS project with all necessary dependencies, environment configuration, project structure, and **transaction management**.

### Tasks

#### 1.1 Project Initialization

```bash
# Create new NestJS project
nest new erp-system --package-manager npm

# Navigate to project
cd erp-system
```

#### 1.2 Install Core Dependencies

```bash
# TypeORM & PostgreSQL
npm install @nestjs/typeorm typeorm pg

# 🔥 Transaction Management - CRITICAL DEPENDENCY
npm install typeorm-transactional

# Configuration
npm install @nestjs/config

# Validation
npm install class-validator class-transformer

# Authentication & Security
npm install @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt

# Swagger Documentation
npm install @nestjs/swagger swagger-ui-express

# Utilities
npm install rxjs
```

#### 1.3 Create Project Structure

Create the following directory structure:

```
src/
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   └── validators/
├── config/
├── entities/
│   ├── base/
│   ├── lookup/
│   ├── users/
│   └── business/
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── services/
│   │   └── strategies/
│   ├── users/
│   │   ├── controllers/
│   │   ├── dto/
│   │   └── services/
│   └── shared/
├── repositories/
│   ├── generic/
│   └── users/
├── services/
│   └── generic/
└── migrations/
```

#### 1.4 Environment Configuration

Create `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=erp_database
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_REFRESH_EXPIRATION=7d

# Password Reset
PASSWORD_RESET_EXPIRATION=1h

# Logging
LOG_LEVEL=debug
```

Create `.env.example` (same as above with placeholder values)

Create `.gitignore` additions:

```
.env
.env.local
.env.*.local
dist/
node_modules/
```

#### 1.5 Database Configuration with Transaction Support

Create `src/config/database.config.ts`:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
    logging: configService.get<boolean>('DB_LOGGING'),
    ssl:
      configService.get('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
  }),
  inject: [ConfigService],
  // 🔥 CRITICAL: Initialize transactional data source
  async dataSourceFactory(options: DataSourceOptions) {
    if (!options) {
      throw new Error('Invalid options passed');
    }
    return addTransactionalDataSource(new DataSource(options));
  },
};
```

Create `ormconfig.ts` for migrations:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/entities/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d ormconfig.ts",
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d ormconfig.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ormconfig.ts",
    "seed": "ts-node src/database/seeds/seed.ts"
  }
}
```

#### 1.6 Update Main.ts - Initialize Transaction Context

**🔥 CRITICAL STEP: Must be done BEFORE creating NestJS app**

Create/Update `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  // 🔥 CRITICAL: Initialize transactional context FIRST
  // This MUST be called before creating the NestJS app
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ERP System API')
    .setDescription('The ERP System API with Transaction Management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`✅ Transaction Management: ENABLED`);
}
bootstrap();
```

#### 1.7 Update App Module

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
```

### Deliverables

- ✅ Initialized NestJS project with TypeScript
- ✅ All dependencies installed including **typeorm-transactional**
- ✅ Complete folder structure created
- ✅ Environment configuration files
- ✅ Database configuration with TypeORM and **transaction support**
- ✅ Migration scripts configured
- ✅ **Transaction context initialized in main.ts**
- ✅ App module with global configuration

### Verification Steps

1. Run `npm install` - should complete without errors
2. Check all folders exist in `src/`
3. Verify `.env` file is created and `.gitignore` includes it
4. Verify `main.ts` calls `initializeTransactionalContext()` FIRST
5. Run `npm run build` - should compile successfully

---

## 🎯 PHASE 2: Common Infrastructure Layer

### Objective

Create all common utilities, interfaces, exceptions, filters, interceptors, and decorators that will be used across the application.

### Tasks

#### 2.1 Create Interfaces

Create `src/common/interfaces/pagination.interface.ts`:

```typescript
export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
```

#### 2.2 Create Custom Exceptions

Create `src/common/exceptions/not-found.exception.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
```

Create `src/common/exceptions/business-validation.exception.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessValidationException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

Create `src/common/exceptions/conflict.exception.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class ConflictException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}
```

Create `src/common/exceptions/forbidden.exception.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor(messageKey: string = 'INSUFFICIENT_PERMISSIONS', details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
```

#### 2.3 Create Global Exception Filter

Create `src/common/filters/all-exceptions.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  messageKey: string;
  details?: any;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'messageKey' in exceptionResponse
      ) {
        messageKey = (exceptionResponse as any).messageKey;
        details = (exceptionResponse as any).details;
      } else if (typeof exceptionResponse === 'string') {
        messageKey = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = (exceptionResponse as any).message;
        if (Array.isArray(messages) && messages.length > 0) {
          messageKey = messages[0];
          details = { validationErrors: messages };
        } else {
          messageKey = messages;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      messageKey = 'INTERNAL_SERVER_ERROR';
      details =
        process.env.NODE_ENV === 'development'
          ? {
              message: exception.message,
              stack: exception.stack,
            }
          : undefined;
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode] || 'Internal Server Error',
      messageKey,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} - Status: ${statusCode} - MessageKey: ${messageKey}`,
    );

    response.status(statusCode).json(errorResponse);
  }
}
```

#### 2.4 Create Response Interceptor

Create `src/common/interceptors/response.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  messageKey?: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

#### 2.5 Create Decorators

Create `src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

Create `src/common/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Create `src/common/decorators/api-response.decorator.ts`:

```typescript
import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiResponseWrapper = <TModel extends Type<any>>(
  model: TModel,
  isArray = false,
  isPaginated = false,
) => {
  if (isPaginated) {
    return applyDecorators(
      ApiOkResponse({
        schema: {
          allOf: [
            {
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(model) },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        total: { type: 'number' },
                        totalPages: { type: 'number' },
                      },
                    },
                  },
                },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
      }),
    );
  }

  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: isArray
                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    }),
  );
};
```

#### 2.6 Create Base DTOs

Create `src/common/dto/base-filter.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BaseFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'id' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Schema name' })
  @IsOptional()
  @IsString()
  schema?: string;
}
```

#### 2.7 Create Shared Module

Create `src/modules/shared/shared.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [],
  exports: [],
})
export class SharedModule {}
```

### Deliverables

- ✅ All common interfaces created
- ✅ Custom exception classes
- ✅ Global exception filter
- ✅ Response interceptor
- ✅ Custom decorators
- ✅ Base DTOs
- ✅ Shared module structure

### Verification Steps

1. All files compile without errors
2. TypeScript types are properly defined
3. No circular dependencies

---

## 🎯 PHASE 3: Base Entities & Generic Patterns with Transaction Support

### Objective

Create base entity classes and generic repository/service patterns that all other entities will extend, **with full transaction management support**.

### Tasks

#### 3.1 Create Base Transaction Entity

Create `src/entities/base/base-transaction.entity.ts`:

```typescript
import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
```

#### 3.2 Create Generic Repository

Create `src/repositories/generic/generic.repository.ts`:

```typescript
import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';

export abstract class GenericRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findById(id: number, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      ...options,
    });
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findWithPagination(
    paginationOptions: IPaginationOptions,
    findOptions?: FindManyOptions<T>,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      ...findOptions,
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return this.repository.save(newEntity);
  }

  async createMany(entities: Partial<T>[]): Promise<T[]> {
    const newEntities = this.repository.create(entities);
    return this.repository.save(newEntities);
  }

  async update(id: number, entity: Partial<T>): Promise<T> {
    await this.repository.update(id, entity as any);
    return this.findById(id);
  }

  async updateMany(entities: Array<{ id: number } & Partial<T>>): Promise<T[]> {
    const updatePromises = entities.map((entity) =>
      this.update(entity.id, entity),
    );
    return Promise.all(updatePromises);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  getQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }
}
```

#### 3.3 Create Generic Service with Transaction Support

**🔥 CRITICAL: This is where transaction magic happens!**

Create `src/services/generic/generic.service.ts`:

```typescript
import { GenericRepository } from '../../repositories/generic/generic.repository';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';
import { FindManyOptions } from 'typeorm';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { Transactional } from 'typeorm-transactional';

export abstract class GenericService<T, CreateDto, UpdateDto, ResponseDto> {
  constructor(
    protected readonly repository: GenericRepository<T>,
    protected readonly entityName: string,
  ) {}

  abstract toResponseDto(entity: T): ResponseDto;
  abstract toEntity(dto: CreateDto | UpdateDto): Partial<T>;

  // ❌ READ OPERATIONS: DO NOT need @Transactional
  async findAll(options?: FindManyOptions<T>): Promise<ResponseDto[]> {
    const entities = await this.repository.findAll(options);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // ❌ READ OPERATIONS: DO NOT need @Transactional
  async findWithPagination(
    paginationOptions: IPaginationOptions,
    findOptions?: FindManyOptions<T>,
  ): Promise<PaginatedResult<ResponseDto>> {
    const result = await this.repository.findWithPagination(
      paginationOptions,
      findOptions,
    );

    return {
      data: result.data.map((entity) => this.toResponseDto(entity)),
      meta: result.meta,
    };
  }

  // ❌ READ OPERATIONS: DO NOT need @Transactional
  async findById(id: number): Promise<ResponseDto> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    return this.toResponseDto(entity);
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  // If this method fails, the transaction will rollback automatically
  @Transactional()
  async create(dto: CreateDto, userId?: number): Promise<ResponseDto> {
    const entityData = this.toEntity(dto);

    if (userId) {
      entityData['createdBy'] = userId;
    }

    const entity = await this.repository.create(entityData);
    return this.toResponseDto(entity);
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  // All creates will succeed or all will rollback
  @Transactional()
  async createMany(dtos: CreateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        entityData['createdBy'] = userId;
      }
      return entityData;
    });

    const entities = await this.repository.createMany(entitiesData);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  @Transactional()
  async update(dto: UpdateDto, userId?: number): Promise<ResponseDto> {
    const id = dto['id'];

    if (!id) {
      throw new NotFoundException(
        `${this.entityName.toUpperCase()}_ID_REQUIRED`,
      );
    }

    const existingEntity = await this.repository.findById(id);

    if (!existingEntity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    const entityData = this.toEntity(dto);

    if (userId) {
      entityData['updatedBy'] = userId;
    }

    const updatedEntity = await this.repository.update(id, entityData);
    return this.toResponseDto(updatedEntity);
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  @Transactional()
  async updateMany(dtos: UpdateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        entityData['updatedBy'] = userId;
      }
      return { id: dto['id'], ...entityData };
    });

    const entities = await this.repository.updateMany(entitiesData);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  @Transactional()
  async delete(id: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    await this.repository.delete(id);
  }

  // ✅ WRITE OPERATION: Needs @Transactional
  @Transactional()
  async softDelete(id: number, userId?: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    await this.repository.update(id, {
      isActive: false,
      updatedBy: userId,
    } as any);
  }
}
```

### 📚 Understanding @Transactional Decorator

**What it does:**
- Wraps the method in a database transaction
- If ANY operation fails, ALL changes are rolled back
- Ensures data consistency

**When to use it:**
- ✅ **CREATE** operations (single or batch)
- ✅ **UPDATE** operations (single or batch)
- ✅ **DELETE** operations (hard or soft)
- ✅ Any operation that modifies data
- ✅ Complex operations involving multiple tables

**When NOT to use it:**
- ❌ **READ** operations (findAll, findById, findOne, etc.)
- ❌ Operations that only query data

**Nested Transactions:**
If you call a @Transactional method from another @Transactional method, they share the same transaction. If the inner method throws an error, the outer transaction also rolls back.

### Deliverables

- ✅ Base transaction entity with audit fields
- ✅ Generic repository with CRUD operations
- ✅ Generic service with business logic layer **and @Transactional decorators**
- ✅ Pagination support
- ✅ Soft delete functionality
- ✅ **Full transaction management for all write operations**

### Verification Steps

1. All files compile without TypeScript errors
2. Generic patterns are properly typed
3. Abstract methods are clearly defined
4. **@Transactional decorators are properly imported and used**

---

## 🎯 PHASE 4: User Entity & Authentication System (Part 1 - User Entity)

### Objective

Create the User entity with Role management and password reset functionality.

### Tasks

#### 4.1 Create Role Entity

Create `src/entities/lookup/role.entity.ts`:

```typescript
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseTransactionEntity } from '../base/base-transaction.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'role', schema: 'lookup' })
export class Role extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
```

#### 4.2 Create User Entity

Create `src/entities/users/user.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTransactionEntity } from '../base/base-transaction.entity';
import { Role } from '../lookup/role.entity';

@Entity({ name: 'user', schema: 'users' })
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'fk_role_id', type: 'int', nullable: false })
  fkRoleId: number;

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'fk_role_id' })
  role: Role;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 500,
    nullable: true,
    select: false,
  })
  refreshToken: string;

  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 500,
    nullable: true,
    select: false,
  })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;
}
```

#### 4.3 Create Database Migration for Users & Roles

```bash
npm run migration:create src/migrations/CreateUsersAndRoles
```

Create `src/migrations/TIMESTAMP-CreateUsersAndRoles.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndRoles1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schemas
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS lookup`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS users`);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE lookup.role (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users.user (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        fk_role_id INT NOT NULL,
        refresh_token VARCHAR(500),
        password_reset_token VARCHAR(500),
        password_reset_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        updated_by INT,
        is_active BOOLEAN DEFAULT true,
        CONSTRAINT fk_user_role FOREIGN KEY (fk_role_id) REFERENCES lookup.role(id) ON DELETE RESTRICT
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_user_email ON users.user(email)`);
    await queryRunner.query(`CREATE INDEX idx_user_username ON users.user(username)`);
    await queryRunner.query(`CREATE INDEX idx_user_role ON users.user(fk_role_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users.user CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS lookup.role CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS lookup CASCADE`);
  }
}
```

#### 4.4 Create Seed Data
Create `src/database/seeds/seed.ts`:
```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import ormConfig from '../../ormconfig';

config();

async function seed() {
  const dataSource = await ormConfig.initialize();

  try {
    console.log('Seeding database...');

    // Seed Roles
    const roles = [
      { name: 'admin', description: 'System Administrator with full access' },
      { name: 'manager', description: 'Manager with elevated permissions' },
      { name: 'sales', description: 'Sales team member' },
      { name: 'cashier', description: 'Cashier for POS operations' },
      { name: 'owner', description: 'Business owner with management access' },
      { name: 'employee', description: 'General employee access' },
    ];

    for (const role of roles) {
      await dataSource.query(
        `INSERT INTO lookup.role (name, description, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO NOTHING`,
        [role.name, role.description]
      );
    }

    console.log('✅ Roles seeded successfully');

    // Get admin role ID
    const [adminRole] = await dataSource.query(
      `SELECT id FROM lookup.role WHERE name = 'admin'`
    );

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await dataSource.query(
      `INSERT INTO users.user (username, email, password, first_name, last_name, fk_role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@erp.com', hashedPassword, 'System', 'Administrator', adminRole.id]
    );

    console.log('✅ Admin user seeded successfully');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   Email: admin@erp.com');

    console.log('\n✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seed();
```

Update `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/database/seeds/seed.ts"
  }
}
```

### Deliverables

- ✅ Role entity in lookup schema
- ✅ User entity with all fields including password reset
- ✅ Database migration for users and roles
- ✅ Seed script with initial roles and admin user
- ✅ Proper indexes on email and username

### Verification Steps

1. Run `npm run migration:run` - should execute successfully
2. Run `npm run seed` - should create roles and admin user
3. Check PostgreSQL database for `lookup.role` and `users.user` tables
4. Verify admin user can be found with email: admin@erp.com

---

## 📚 Complete Development Guide with Transaction Management

### 1. Architecture Overview

The project follows a modular, layered architecture using NestJS with **built-in transaction management**.

#### Layers

1. **Controllers (`src/modules/*/controllers`)**: Handle HTTP requests, validation, and response formatting.
2. **Services (`src/modules/*/services`)**: Contain business logic. Extend `GenericService` for common CRUD operations with transaction support.
3. **Repositories (`src/modules/*/repositories`)**: Handle database interactions. Extend `GenericRepository` for common DB operations.
4. **Entities (`src/modules/*/entities`)**: Define database schema. Extend `BaseTransactionEntity`.
5. **DTOs (`src/modules/*/dto`)**: Define data transfer objects for validation.

### 2. Directory Structure

```
src/
├── common/             # Shared utilities (decorators, filters, guards, etc.)
├── config/             # Configuration files (with transaction setup)
├── modules/            # Feature modules (Domain Driven)
│   └── [feature]/
│       ├── controllers/
│       ├── dto/
│       ├── entities/   # Feature-specific entities
│       ├── repositories/ # Feature-specific repositories
│       ├── services/   # Services with @Transactional methods
│       └── [feature].module.ts
└── services/           # Shared services
    └── generic/        # Generic service base with transactions
```

### 3. Step-by-Step Feature Implementation with Transactions

To add a new feature (e.g., `Products`), follow these steps:

#### Step 1: Create Entity

Create `src/modules/products/entities/product.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseTransactionEntity } from '../../../entities/base/base-transaction.entity';

@Entity({ name: 'products', schema: 'business' })
export class Product extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;
}
```

#### Step 2: Create Repository

Create `src/modules/products/repositories/product.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../repositories/generic/generic.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends GenericRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {
    super(productRepo);
  }

  // Add custom repository methods if needed
  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { sku } });
  }
}
```

#### Step 3: Create DTOs

Create `src/modules/products/dto/create-product.dto.ts`:

```typescript
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'LAP-DELL-XPS15' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 1299.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;
}
```

Create `src/modules/products/dto/update-product.dto.ts`:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;
}
```

Create `src/modules/products/dto/product-response.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

#### Step 4: Create Service with Transactions

**🔥 CRITICAL: Use @Transactional on business logic methods**

Create `src/modules/products/services/products.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { GenericService } from '../../../services/generic/generic.service';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ConflictException } from '../../../common/exceptions/conflict.exception';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';

@Injectable()
export class ProductsService extends GenericService<
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto
> {
  constructor(private readonly productRepo: ProductRepository) {
    super(productRepo, 'Product');
  }

  // Implement abstract methods
  toResponseDto(entity: Product): ProductResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      sku: entity.sku,
      price: Number(entity.price),
      stock: entity.stock,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toEntity(dto: CreateProductDto | UpdateProductDto): Partial<Product> {
    return {
      name: dto.name,
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock,
    };
  }

  // 🔥 Override create with business validation and transaction
  @Transactional()
  async create(dto: CreateProductDto, userId?: number): Promise<ProductResponseDto> {
    // Business validation: Check if SKU already exists
    const existingProduct = await this.productRepo.findBySku(dto.sku);
    if (existingProduct) {
      throw new ConflictException('PRODUCT_SKU_ALREADY_EXISTS');
    }

    // Call parent create (also wrapped in transaction)
    return super.create(dto, userId);
  }

  // 🔥 Complex business operation with transaction
  // If any step fails, everything rolls back
  @Transactional()
  async reduceStock(productId: number, quantity: number, userId?: number): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById(productId);

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    if (product.stock < quantity) {
      throw new BusinessValidationException('INSUFFICIENT_STOCK', {
        available: product.stock,
        requested: quantity,
      });
    }

    // Reduce stock
    const updatedProduct = await this.productRepo.update(productId, {
      stock: product.stock - quantity,
      updatedBy: userId,
    });

    return this.toResponseDto(updatedProduct);
  }

  // 🔥 Batch operation with transaction
  // All products updated or none
  @Transactional()
  async updatePrices(priceUpdates: Array<{ id: number; newPrice: number }>, userId?: number): Promise<ProductResponseDto[]> {
    const results: ProductResponseDto[] = [];

    for (const update of priceUpdates) {
      const product = await this.productRepo.findById(update.id);
      if (!product) {
        throw new NotFoundException(`PRODUCT_NOT_FOUND: ${update.id}`);
      }

      if (update.newPrice < 0) {
        throw new BusinessValidationException(`INVALID_PRICE: ${update.newPrice}`);
      }

      const updated = await this.productRepo.update(update.id, {
        price: update.newPrice,
        updatedBy: userId,
      });

      results.push(this.toResponseDto(updated));
    }

    return results;
  }
}
```

#### Step 5: Create Controller

Create `src/modules/products/controllers/products.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiResponseWrapper(ProductResponseDto, false, true)
  async findAll(@Query() filter: BaseFilterDto) {
    return this.productsService.findWithPagination(
      { page: filter.page, limit: filter.limit },
      {
        order: {
          [filter.sortBy]: filter.sortOrder,
        },
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponseWrapper(ProductResponseDto)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponseWrapper(ProductResponseDto)
  async create(@Body() dto: CreateProductDto) {
    // In real app, get userId from JWT token
    return this.productsService.create(dto, 1);
  }

  @Put()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponseWrapper(ProductResponseDto)
  async update(@Body() dto: UpdateProductDto) {
    return this.productsService.update(dto, 1);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }

  @Post(':id/reduce-stock')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Reduce product stock' })
  @ApiResponseWrapper(ProductResponseDto)
  async reduceStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.productsService.reduceStock(id, quantity, 1);
  }
}
```

#### Step 6: Create Module

Create `src/modules/products/products.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
```

#### Step 7: Register Module

Import `ProductsModule` in `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    ProductsModule, // Add here
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## 🔥 Transaction Management Best Practices

### 1. When to Use @Transactional

✅ **USE @Transactional for:**
- Creating records (single or batch)
- Updating records (single or batch)
- Deleting records
- Complex operations involving multiple tables
- Operations that must be atomic (all-or-nothing)
- Business logic that modifies data

❌ **DO NOT use @Transactional for:**
- Read-only operations (findAll, findById, etc.)
- Simple queries that don't modify data
- Operations that don't need atomicity

### 2. Nested Transactions

```typescript
@Injectable()
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private productService: ProductsService, // Has @Transactional methods
  ) {}

  // 🔥 This method and productService.reduceStock share the same transaction
  @Transactional()
  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Create order
    const order = await this.orderRepo.create(dto);

    // Reduce product stock (also @Transactional)
    // If this fails, order creation rolls back too!
    await this.productService.reduceStock(dto.productId, dto.quantity);

    return this.toResponseDto(order);
  }
}
```

### 3. Manual Transaction Control (Advanced)

For complex scenarios, you can use QueryRunner:

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ComplexService {
  constructor(private dataSource: DataSource) {}

  async complexOperation() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Perform multiple operations
      await queryRunner.manager.save(entity1);
      await queryRunner.manager.save(entity2);
      await queryRunner.manager.update(Entity3, id, data);

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
```

### 4. Transaction Isolation Levels

```typescript
import { Transactional, IsolationLevel } from 'typeorm-transactional';

@Injectable()
export class PaymentService {
  // Set custom isolation level
  @Transactional({ isolationLevel: IsolationLevel.SERIALIZABLE })
  async processPayment(dto: PaymentDto): Promise<PaymentResponseDto> {
    // Critical financial operation
    // SERIALIZABLE prevents concurrent modifications
  }
}
```

### 5. Error Handling with Transactions

```typescript
@Injectable()
export class UserService {
  @Transactional()
  async createUserWithProfile(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Create user
      const user = await this.userRepo.create(dto);

      // Create profile
      await this.profileRepo.create({ userId: user.id, ...dto.profile });

      // Send welcome email (non-transactional, don't let it fail the transaction)
      this.emailService.sendWelcomeEmail(user.email).catch(err => {
        // Log error but don't throw
        this.logger.error('Failed to send welcome email', err);
      });

      return this.toResponseDto(user);
    } catch (error) {
      // Transaction automatically rolls back
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }
}
```

---

## 🎯 Summary Checklist

### For Every New Project:
- ✅ Install `typeorm-transactional`
- ✅ Call `initializeTransactionalContext()` in `main.ts` FIRST
- ✅ Configure `dataSourceFactory` in database config
- ✅ Extend `GenericService` for automatic transaction support
- ✅ Use `@Transactional()` on all write operations

### For Every New Feature:
- ✅ Create entity extending `BaseTransactionEntity`
- ✅ Create repository extending `GenericRepository`
- ✅ Create service extending `GenericService`
- ✅ Add `@Transactional()` to custom write methods
- ✅ Test transaction rollback scenarios
- ✅ Document complex business logic

### Testing Transactions:
```typescript
// Test that transaction rolls back on error
it('should rollback on error', async () => {
  const initialCount = await productRepo.count();

  try {
    await productService.createWithInvalidData(dto);
  } catch (error) {
    // Expected error
  }

  const finalCount = await productRepo.count();
  expect(finalCount).toBe(initialCount); // No new records
});
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start development server
npm run start:dev

# Visit API docs
http://localhost:3000/api/docs
```

---

## 📚 Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [typeorm-transactional](https://github.com/Aliheym/typeorm-transactional)
- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

---

**🎉 You now have a complete, production-ready NestJS ERP system with full transaction management support!**