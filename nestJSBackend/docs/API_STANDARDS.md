# API Standards & Best Practices

**Version:** 2.0  
**Last Updated:** 2025-12-28

---

## 📋 Table of Contents

1. [Response Format Standards](#response-format-standards)
2. [Error Handling](#error-handling)
3. [Pagination](#pagination)
4. [DTO Patterns](#dto-patterns)
5. [Controller Patterns](#controller-patterns)
6. [Service Patterns](#service-patterns)
7. [Swagger Documentation](#swagger-documentation)

---

## Response Format Standards

### Success Response

All successful API responses follow this structure:

```typescript
{
  "success": true,
  "data": T,  // Entity or array
  "messageKey": "OPTIONAL_I18N_KEY",
  "timestamp": "2025-12-28T00:00:00.000Z"
}
```

**Implementation:**
```typescript
import { ApiResponseDto } from '@/common/dto';

return ApiResponseDto.success(product, 'PRODUCT_CREATED');
```

---

### Paginated Response

For list endpoints with pagination:

```typescript
{
  "success": true,
  "data": T[],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2025-12-28T00:00:00.000Z"
}
```

**Implementation:**
```typescript
import { PaginatedResponseDto } from '@/common/dto';

const result = await service.findAllPaginated(options, { page, limit });
return PaginatedResponseDto.success(result.data, result.meta);
```

---

### Error Response

All error responses follow this structure:

```typescript
{
  "success": false,
  "error": {
    "code": "MODULE_XXX",
    "messageKey": "ERROR_KEY",
    "message": "Human-readable error",
    "details": { /* optional context */ }
  },
  "timestamp": "2025-12-28T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

**Implementation:**
```typescript
throw new BadRequestException({
  code: 'PROD_002',
  message: 'SKU already exists',
  details: { sku: dto.sku }
});
```

---

## Error Handling

### Error Code Format

`MODULE_XXX` where:
- `MODULE` = Module name (PROD, SALES, INV, ZATCA, CASH, AUTH)
- `XXX` = Sequential number (001, 002, etc.)

### HTTP Status Codes

| Status | Usage | Example |
|--------|-------|---------|
| 200 | Successful GET/PUT | Get product details |
| 201 | Successful POST | Create product |
| 204 | Successful DELETE | Delete product |
| 400 | Validation/Business error | `PROD_002` SKU exists |
| 401 | Authentication failed | Token expired |
| 403 | Authorization failed | Insufficient permissions |
| 404 | Resource not found | Product not found |
| 409 | Conflict | Duplicate resource |
| 422 | DTO validation failed | class-validator errors |
| 500 | System error | Transaction rollback |

### Critical Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `ZATCA_001` | Hash chain broken | HALT invoicing |
| `INV_002` | Insufficient stock | Block checkout |
| `SALES_003` | Order already paid | Read-only view |
| `AUTH_004` | Token expired | Redirect to login |
| `CASH_001` | Session not open | Force session open |

---

## Pagination

### Query Parameters

```typescript
export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Service Implementation

```typescript
async findProducts(query: ProductQueryDto): Promise<PaginatedResult<Product>> {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  
  const [data, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
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
```

---

## DTO Patterns

### Create DTO

```typescript
export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 25.00 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
```

### Update DTO

```typescript
export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Query DTO

```typescript
export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
```

### Response DTO

```typescript
export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty() salePrice: number;
  @ApiPropertyOptional({ type: CategoryResponseDto })
  category?: CategoryResponseDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
```

---

## Controller Patterns

### Standard CRUD Controller

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.service.createProduct(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get products with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  findAll(@Query() query: ProductQueryDto): Promise<PaginatedResult<Product>> {
    return this.service.findProducts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.service.findProductWithModifiers(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.service.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteProduct(id);
  }
}
```

---

## Service Patterns

### Extend GenericService

```typescript
@Injectable()
export class ProductsService extends GenericService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {
    super(productRepo);
  }

  // Override for custom relations
  async findById(id: string): Promise<Product> {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'modifierGroups'],
    });
  }

  // Custom business logic
  @Transactional()
  async createProduct(dto: CreateProductDto): Promise<Product> {
    // Validate uniqueness
    const existing = await this.productRepo.findOne({ where: { sku: dto.sku } });
    if (existing) {
      throw new BadRequestException({ code: 'PROD_002', message: 'SKU exists' });
    }

    // Create entity
    const product = this.productRepo.create(dto);
    return await this.productRepo.save(product);
  }
}
```

### Transaction Rules

**✅ ALWAYS use `@Transactional()` on:**
- `create()`, `createMany()`
- `update()`, `updateMany()`
- `delete()`, `softDelete()`
- Any method that modifies database state

**❌ NEVER use `@Transactional()` on:**
- `findAll()`, `findById()`, `findOne()`
- Read-only query methods

---

## Swagger Documentation

### Complete Example

```typescript
@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a product with optional modifier linking',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'SKU or barcode already exists',
    schema: {
      example: {
        success: false,
        error: {
          code: 'PROD_002',
          message: 'SKU already exists',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.service.createProduct(dto);
  }
}
```

---

## Best Practices

### 1. Consistent Naming

- **Entities:** PascalCase (e.g., `Product`, `SalesOrder`)
- **DTOs:** PascalCase with suffix (e.g., `CreateProductDto`, `ProductResponseDto`)
- **Services:** PascalCase with suffix (e.g., `ProductsService`)
- **Controllers:** PascalCase with suffix (e.g., `ProductsController`)

### 2. Validation

- Use `class-validator` decorators on all DTOs
- Use `@Type()` for type transformation
- Use `ParseUUIDPipe` for UUID parameters

### 3. Error Messages

- Use error codes for programmatic handling
- Use `messageKey` for i18n support
- Include helpful details in error responses

### 4. Documentation

- Add `@ApiOperation()` to all endpoints
- Add `@ApiResponse()` for all status codes
- Add `@ApiProperty()` to all DTO fields
- Add JSDoc comments to complex methods

---

## Quick Reference

### Import Paths

```typescript
// Common DTOs
import { ApiResponseDto, PaginationQueryDto } from '@/common/dto';

// Generic Service
import { GenericService } from '@/common/services/generic.service';

// Abstract Entity
import { AbstractEntity } from '@/common/entities/abstract.entity';

// Decorators
import { Transactional } from 'typeorm-transactional';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
```

### File Structure

```
src/modules/{module}/
├── controllers/
│   └── {module}.controller.ts
├── services/
│   └── {module}.service.ts
├── entities/
│   └── {entity}.entity.ts
├── dto/
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── {entity}-response.dto.ts
└── types/
    └── {module}.types.ts
```

---

**Last Updated:** 2025-12-28  
**Maintained By:** NerdPOS Development Team
