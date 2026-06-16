import { Module } from '@nestjs/common';
import { CountryModule } from '../country/country.module';
import { TaxRegimeModule } from '../tax-regime/tax-regime.module';
import { SalaryComponentModule } from '../salary-component/salary-component.module';
import { StatutoryContributionModule } from '../statutory-contribution/statutory-contribution.module';
import { TaxSlabModule } from '../tax-slab/tax-slab.module';
import { DeductionSectionModule } from '../deduction-section/deduction-section.module';
import { CurrencyModule } from '../currency/currency.module';
import { CalculationController } from './calculation.controller';
import { CalculationOrchestratorService } from './services/calculation-orchestrator.service';
import { SalaryCalculatorService } from './services/salary-calculator.service';
import { StatutoryCalculatorService } from './services/statutory-calculator.service';
import { TaxCalculatorService } from './services/tax-calculator.service';
import { CurrencyConverterService } from './services/currency-converter.service';

@Module({
  imports: [
    CountryModule,
    TaxRegimeModule,
    SalaryComponentModule,
    StatutoryContributionModule,
    TaxSlabModule,
    DeductionSectionModule,
    CurrencyModule,
  ],
  controllers: [CalculationController],
  providers: [
    CalculationOrchestratorService,
    SalaryCalculatorService,
    StatutoryCalculatorService,
    TaxCalculatorService,
    CurrencyConverterService,
  ],
})
export class CalculationModule {}
