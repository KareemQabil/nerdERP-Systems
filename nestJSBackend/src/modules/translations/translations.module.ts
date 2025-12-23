import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation, SupportedLanguage } from './entities/translation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Translation,
            SupportedLanguage,
        ]),
    ],
    providers: [],
    exports: [],
})
export class TranslationsModule { }
