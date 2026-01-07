import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation, SupportedLanguage } from './entities/translation.entity';
import { TranslationService } from './services/translation.service';
import { TranslationController } from './controllers/translation.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Translation,
            SupportedLanguage,
        ]),
    ],
    providers: [TranslationService],
    controllers: [TranslationController],
    exports: [TranslationService],
})
export class TranslationsModule { }
