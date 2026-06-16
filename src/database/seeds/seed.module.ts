import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../../config/app.config';
import databaseConfig from '../../config/database.config';
import { validationSchema } from '../../config/validation.schema';
import { Country } from '../../modules/country/entities/country.entity';
import { TaxRegime } from '../../modules/tax-regime/entities/tax-regime.entity';
import { SalaryComponent } from '../../modules/salary-component/entities/salary-component.entity';
import { ComponentCondition } from '../../modules/salary-component/entities/component-condition.entity';
import { TaxSlab } from '../../modules/tax-slab/entities/tax-slab.entity';
import { TaxSurcharge } from '../../modules/tax-slab/entities/tax-surcharge.entity';
import { TaxCess } from '../../modules/tax-slab/entities/tax-cess.entity';
import { StatutoryContribution } from '../../modules/statutory-contribution/entities/statutory-contribution.entity';
import { DeductionSection } from '../../modules/deduction-section/entities/deduction-section.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: false,
        entities: [
          Country, TaxRegime, SalaryComponent, ComponentCondition,
          TaxSlab, TaxSurcharge, TaxCess, StatutoryContribution, DeductionSection,
        ],
      }),
    }),
    TypeOrmModule.forFeature([
      Country, TaxRegime, SalaryComponent, ComponentCondition,
      TaxSlab, TaxSurcharge, TaxCess, StatutoryContribution, DeductionSection,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
