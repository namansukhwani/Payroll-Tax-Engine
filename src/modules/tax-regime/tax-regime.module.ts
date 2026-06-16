import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryModule } from '../country/country.module';
import { TaxRegime } from './entities/tax-regime.entity';
import { TaxRegimeController } from './tax-regime.controller';
import { TaxRegimeService } from './tax-regime.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRegime]), CountryModule],
  controllers: [TaxRegimeController],
  providers: [TaxRegimeService],
  exports: [TaxRegimeService],
})
export class TaxRegimeModule {}
