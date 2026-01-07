import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entities/recipe.entity';
import { Product } from '../../products/entities/product.entity';
import { Decimal } from 'decimal.js';

/**
 * Recipe Bill of Materials (BOM) Service
 *
 * Handles exploding prepared products into their raw material ingredients
 * for accurate inventory deduction in sales and production workflows.
 *
 * Example:
 * - Product: "Burger" (isPrepared: true)
 * - Recipe Ingredients: 1x Bun, 0.15kg Beef Patty, 1x Cheese Slice
 * - When 1 Burger sold → Deduct Bun, Beef Patty, Cheese (not Burger stock)
 */
@Injectable()
export class RecipeBomService {
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    /**
     * Get all ingredients for a prepared product (BOM explosion)
     *
     * @param productId The prepared product ID (e.g., "Burger")
     * @param quantity The quantity of the prepared product being used/sold
     * @returns Array of ingredient deductions required
     */
    async explodeBom(productId: string, quantity: number | Decimal): Promise<BomIngredient[]> {
        const qty = quantity instanceof Decimal ? quantity : new Decimal(quantity);

        // 1. Verify product is prepared
        const product = await this.productRepo.findOneBy({ id: productId });
        if (!product) {
            throw new NotFoundException(`Product not found: ${productId}`);
        }

        if (!product.isPrepared) {
            // Not a prepared product, no BOM to explode
            return [];
        }

        // 2. Fetch recipe ingredients
        const recipes = await this.recipeRepo.find({
            where: { product: { id: productId } },
            relations: ['ingredient'],
        });

        if (recipes.length === 0) {
            throw new BadRequestException({
                code: 'BOM_001',
                messageKey: 'RECIPE_NOT_FOUND',
                message: `Product "${product.name}" is marked as prepared but has no recipe defined`,
            });
        }

        // 3. Calculate ingredient requirements
        const ingredients: BomIngredient[] = [];
        for (const recipe of recipes) {
            if (!recipe.ingredient) {
                continue; // Skip if ingredient not found (shouldn't happen)
            }

            const ingredientQty = new Decimal(recipe.quantityRequired).mul(qty);

            ingredients.push({
                productId: recipe.ingredient.id,
                productName: recipe.ingredient.name,
                sku: recipe.ingredient.sku,
                quantity: ingredientQty,
                unitOfMeasure: recipe.ingredient.metadata?.unitOfMeasure || 'unit',
                isPrepared: recipe.ingredient.isPrepared,
            });
        }

        return ingredients;
    }

    /**
     * Recursive BOM explosion for multi-level recipes
     *
     * Handles cases where ingredients are themselves prepared products.
     * Example: "Combo Meal" contains "Burger" (prepared) + "Fries" (prepared)
     *
     * @param productId The product to explode
     * @param quantity The quantity being used/sold
     * @param visited Set of visited products to prevent infinite recursion
     * @returns Flat array of all raw material ingredients required
     */
    async explodeBomRecursive(
        productId: string,
        quantity: number | Decimal,
        visited = new Set<string>(),
    ): Promise<BomIngredient[]> {
        const qty = quantity instanceof Decimal ? quantity : new Decimal(quantity);

        // Prevent infinite recursion
        if (visited.has(productId)) {
            throw new BadRequestException({
                code: 'BOM_002',
                messageKey: 'CIRCULAR_RECIPE',
                message: `Circular recipe detected for product: ${productId}`,
            });
        }
        visited.add(productId);

        const product = await this.productRepo.findOneBy({ id: productId });
        if (!product) {
            throw new NotFoundException(`Product not found: ${productId}`);
        }

        // If not prepared, return as raw material
        if (!product.isPrepared) {
            return [{
                productId,
                productName: product.name,
                sku: product.sku,
                quantity: qty,
                unitOfMeasure: product.metadata?.unitOfMeasure || 'unit',
                isPrepared: false,
            }];
        }

        // Fetch ingredients
        const recipes = await this.recipeRepo.find({
            where: { product: { id: productId } },
            relations: ['ingredient'],
        });

        if (recipes.length === 0) {
            throw new BadRequestException({
                code: 'BOM_001',
                messageKey: 'RECIPE_NOT_FOUND',
                message: `Product "${product.name}" is marked as prepared but has no recipe defined`,
            });
        }

        // Recursively explode each ingredient
        const rawIngredients: BomIngredient[] = [];
        for (const recipe of recipes) {
            if (!recipe.ingredient) {
                continue;
            }

            const ingredientQty = new Decimal(recipe.quantityRequired).mul(qty);

            // Recursively explode if ingredient is also prepared
            if (recipe.ingredient.isPrepared) {
                const subIngredients = await this.explodeBomRecursive(
                    recipe.ingredient.id,
                    ingredientQty,
                    new Set(visited), // Clone visited set for this branch
                );
                rawIngredients.push(...subIngredients);
            } else {
                // Raw material - add to list
                rawIngredients.push({
                    productId: recipe.ingredient.id,
                    productName: recipe.ingredient.name,
                    sku: recipe.ingredient.sku,
                    quantity: ingredientQty,
                    unitOfMeasure: recipe.ingredient.metadata?.unitOfMeasure || 'unit',
                    isPrepared: false,
                });
            }
        }

        return rawIngredients;
    }

    /**
     * Aggregate ingredient quantities (for multi-level recipes)
     *
     * Combines duplicate ingredients from recursive explosion
     * Example: If both "Burger" and "Fries" require "Salt", combine quantities
     *
     * @param ingredients Array of ingredients from BOM explosion
     * @returns Aggregated ingredients with combined quantities
     */
    aggregateIngredients(ingredients: BomIngredient[]): AggregatedIngredient[] {
        const aggregated = new Map<string, AggregatedIngredient>();

        for (const ingredient of ingredients) {
            const key = ingredient.productId;

            if (aggregated.has(key)) {
                // Add to existing
                const existing = aggregated.get(key)!;
                existing.quantity = existing.quantity.plus(ingredient.quantity);
            } else {
                // Create new entry
                aggregated.set(key, {
                    productId: ingredient.productId,
                    productName: ingredient.productName,
                    sku: ingredient.sku,
                    quantity: new Decimal(ingredient.quantity),
                    unitOfMeasure: ingredient.unitOfMeasure,
                });
            }
        }

        return Array.from(aggregated.values());
    }

    /**
     * Check if a product is prepared (has a recipe)
     *
     * @param productId The product ID to check
     * @returns true if product is prepared, false otherwise
     */
    async isPreparedProduct(productId: string): Promise<boolean> {
        const product = await this.productRepo.findOneBy({ id: productId });
        return product?.isPrepared || false;
    }

    /**
     * Get all prepared products in the system
     *
     * @returns Array of products marked as prepared
     */
    async getPreparedProducts(): Promise<Product[]> {
        return this.productRepo.find({
            where: { isPrepared: true, isActive: true },
        });
    }

    /**
     * Validate recipe completeness for a prepared product
     *
     * Ensures all ingredients in the recipe exist and have valid quantities
     *
     * @param productId The product to validate
     * @returns Validation result with any errors found
     */
    async validateRecipe(productId: string): Promise<RecipeValidationResult> {
        const product = await this.productRepo.findOneBy({ id: productId });

        if (!product) {
            return {
                isValid: false,
                errors: [`Product not found: ${productId}`],
            };
        }

        if (!product.isPrepared) {
            return {
                isValid: true,
                warnings: ['Product is not marked as prepared'],
            };
        }

        const recipes = await this.recipeRepo.find({
            where: { product: { id: productId } },
            relations: ['ingredient'],
        });

        if (recipes.length === 0) {
            return {
                isValid: false,
                errors: ['Product marked as prepared but has no recipe defined'],
            };
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        for (const recipe of recipes) {
            if (!recipe.ingredient) {
                errors.push(`Ingredient missing for recipe entry`);
            } else if (!recipe.ingredient.isActive) {
                warnings.push(`Ingredient "${recipe.ingredient.name}" is inactive`);
            }

            if (recipe.quantityRequired <= 0) {
                errors.push(`Invalid quantity for ingredient: ${recipe.ingredient?.name || 'Unknown'}`);
            }

            // Check for circular reference
            if (recipe.ingredient?.id === productId) {
                errors.push(`Circular reference: Product references itself as ingredient`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
}

// =====================================================
// TYPES
// =====================================================

export interface BomIngredient {
    productId: string;
    productName: string;
    sku: string;
    quantity: Decimal;
    unitOfMeasure: string;
    isPrepared: boolean;
}

export interface AggregatedIngredient {
    productId: string;
    productName: string;
    sku: string;
    quantity: Decimal;
    unitOfMeasure: string;
}

export interface RecipeValidationResult {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
}
