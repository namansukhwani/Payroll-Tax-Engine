import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryModule } from '../country/country.module';
import { TaxRegimeModule } from '../tax-regime/tax-regime.module';
import { TaxCess } from './entities/tax-cess.entity';
import { TaxSlab } from './entities/tax-slab.entity';
import { TaxSurcharge } from './entities/tax-surcharge.entity';
import { TaxCessController } from './tax-cess.controller';
import { TaxCessService } from './tax-cess.service';
import { TaxSlabController } from './tax-slab.controller';
import { TaxSlabService } from './tax-slab.service';
import { TaxSurchargeController } from './tax-surcharge.controller';
import { TaxSurchargeService } from './tax-surcharge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxSlab, TaxSurcharge, TaxCess]),
    CountryModule,
    TaxRegimeModule,
  ],
  controllers: [TaxSlabController, TaxSurchargeController, TaxCessController],
  providers: [TaxSlabService, TaxSurchargeService, TaxCessService],
  exports: [TaxSlabService, TaxSurchargeService, TaxCessService],
})
export class TaxSlabModule {}
