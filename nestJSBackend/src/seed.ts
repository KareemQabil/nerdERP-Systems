import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedDataService } from './common/services/seed-data.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(SeedDataService);

    try {
        await seedService.seed();
        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
