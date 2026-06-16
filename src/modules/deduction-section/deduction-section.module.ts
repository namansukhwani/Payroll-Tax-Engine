import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryModule } from '../country/country.module';
import { TaxRegimeModule } from '../tax-regime/tax-regime.module';
import { DeductionSectionController } from './deduction-section.controller';
import { DeductionSectionService } from './deduction-section.service';
import { DeductionSection } from './entities/deduction-section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeductionSection]),
    CountryModule,
    TaxRegimeModule,
  ],
  controllers: [DeductionSectionController],
  providers: [DeductionSectionService],
  exports: [DeductionSectionService],
})
export class DeductionSectionModule {}
