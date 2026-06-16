import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../../modules/country/entities/country.entity';
import { TaxRegime } from '../../modules/tax-regime/entities/tax-regime.entity';
import { SalaryComponent } from '../../modules/salary-component/entities/salary-component.entity';
import { ComponentCondition } from '../../modules/salary-component/entities/component-condition.entity';
import { TaxSlab } from '../../modules/tax-slab/entities/tax-slab.entity';
import { TaxSurcharge } from '../../modules/tax-slab/entities/tax-surcharge.entity';
import { TaxCess } from '../../modules/tax-slab/entities/tax-cess.entity';
import { StatutoryContribution } from '../../modules/statutory-contribution/entities/statutory-contribution.entity';
import { DeductionSection } from '../../modules/deduction-section/entities/deduction-section.entity';
import { INDIA_COUNTRY_SEED } from './data/india/country.seed';
import { INDIA_TAX_REGIMES_SEED } from './data/india/tax-regimes.seed';
import { INDIA_SALARY_COMPONENTS_SEED } from './data/india/salary-components.seed';
import {
  INDIA_TAX_SLABS_SEED,
  INDIA_TAX_SURCHARGES_SEED,
  INDIA_TAX_CESS_SEED,
} from './data/india/tax-slabs.seed';
import { INDIA_STATUTORY_CONTRIBUTIONS_SEED } from './data/india/statutory-contributions.seed';
import { INDIA_DEDUCTION_SECTIONS_SEED } from './data/india/deduction-sections.seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(TaxRegime)
    private readonly taxRegimeRepo: Repository<TaxRegime>,
    @InjectRepository(SalaryComponent)
    private readonly salaryComponentRepo: Repository<SalaryComponent>,
    @InjectRepository(ComponentCondition)
    private readonly conditionRepo: Repository<ComponentCondition>,
    @InjectRepository(TaxSlab)
    private readonly taxSlabRepo: Repository<TaxSlab>,
    @InjectRepository(TaxSurcharge)
    private readonly taxSurchargeRepo: Repository<TaxSurcharge>,
    @InjectRepository(TaxCess)
    private readonly taxCessRepo: Repository<TaxCess>,
    @InjectRepository(StatutoryContribution)
    private readonly statutoryRepo: Repository<StatutoryContribution>,
    @InjectRepository(DeductionSection)
    private readonly deductionRepo: Repository<DeductionSection>,
  ) {}

  async run(): Promise<void> {
    const countryId = await this.seedCountry();
    console.log(`Country seeded: ${countryId}`);

    const regimeIdByCode = await this.seedTaxRegimes(countryId);
    console.log(`Tax regimes seeded: ${Object.keys(regimeIdByCode).join(', ')}`);

    await this.seedSalaryComponents(countryId);
    console.log('Salary components seeded');

    await this.seedTaxSlabs(regimeIdByCode);
    console.log('Tax slabs seeded');

    await this.seedTaxSurcharges(regimeIdByCode);
    console.log('Tax surcharges seeded');

    await this.seedTaxCess(regimeIdByCode);
    console.log('Tax cess seeded');

    await this.seedStatutoryContributions(countryId);
    console.log('Statutory contributions seeded');

    await this.seedDeductionSections(countryId, regimeIdByCode);
    console.log('Deduction sections seeded');
  }

  private async seedCountry(): Promise<string> {
    const existing = await this.countryRepo.findOne({
      where: { code: INDIA_COUNTRY_SEED.code },
    });
    if (existing) return existing.id;

    const saved = await this.countryRepo.save(this.countryRepo.create(INDIA_COUNTRY_SEED));
    return saved.id;
  }

  private async seedTaxRegimes(countryId: string): Promise<Record<string, string>> {
    const regimeIdByCode: Record<string, string> = {};
    for (const data of INDIA_TAX_REGIMES_SEED) {
      const existing = await this.taxRegimeRepo.findOne({
        where: { countryId, code: data.code, effectiveFrom: data.effectiveFrom },
      });
      if (existing) {
        regimeIdByCode[data.code] = existing.id;
        continue;
      }
      const saved = await this.taxRegimeRepo.save(
        this.taxRegimeRepo.create({ ...data, countryId }),
      );
      regimeIdByCode[data.code] = saved.id;
    }
    return regimeIdByCode;
  }

  private async seedSalaryComponents(countryId: string): Promise<void> {
    for (const data of INDIA_SALARY_COMPONENTS_SEED) {
      const { conditions, ...componentData } = data;
      const existing = await this.salaryComponentRepo.findOne({
        where: {
          countryId,
          code: componentData.code,
          effectiveFrom: componentData.effectiveFrom,
        },
      });

      if (existing) {
        await this.conditionRepo.delete({ componentId: existing.id });
        if (conditions.length > 0) {
          await this.conditionRepo.save(
            conditions.map((c) => this.conditionRepo.create({ ...c, componentId: existing.id })),
          );
        }
        continue;
      }

      const savedComponent = await this.salaryComponentRepo.save(
        this.salaryComponentRepo.create({ ...componentData, countryId }),
      );

      if (conditions.length > 0) {
        await this.conditionRepo.save(
          conditions.map((c) =>
            this.conditionRepo.create({ ...c, componentId: savedComponent.id }),
          ),
        );
      }
    }
  }

  private async seedTaxSlabs(regimeIdByCode: Record<string, string>): Promise<void> {
    for (const data of INDIA_TAX_SLABS_SEED) {
      const regimeId = regimeIdByCode[data.regimeCode];
      if (!regimeId) continue;

      const existing = await this.taxSlabRepo.findOne({
        where: { regimeId, minAmount: data.minAmount, effectiveFrom: data.effectiveFrom },
      });
      if (existing) continue;

      const { regimeCode: _, ...slabData } = data;
      await this.taxSlabRepo.save(this.taxSlabRepo.create({ ...slabData, regimeId }));
    }
  }

  private async seedTaxSurcharges(regimeIdByCode: Record<string, string>): Promise<void> {
    for (const data of INDIA_TAX_SURCHARGES_SEED) {
      const regimeId = regimeIdByCode[data.regimeCode];
      if (!regimeId) continue;

      const existing = await this.taxSurchargeRepo.findOne({
        where: { regimeId, minIncome: data.minIncome, effectiveFrom: data.effectiveFrom },
      });
      if (existing) continue;

      const { regimeCode: _, ...surchargeData } = data;
      await this.taxSurchargeRepo.save(
        this.taxSurchargeRepo.create({ ...surchargeData, regimeId }),
      );
    }
  }

  private async seedTaxCess(regimeIdByCode: Record<string, string>): Promise<void> {
    for (const data of INDIA_TAX_CESS_SEED) {
      const regimeId = regimeIdByCode[data.regimeCode];
      if (!regimeId) continue;

      const existing = await this.taxCessRepo.findOne({
        where: { regimeId, cessName: data.cessName, effectiveFrom: data.effectiveFrom },
      });
      if (existing) continue;

      const { regimeCode: _, ...cessData } = data;
      await this.taxCessRepo.save(this.taxCessRepo.create({ ...cessData, regimeId }));
    }
  }

  private async seedStatutoryContributions(countryId: string): Promise<void> {
    for (const data of INDIA_STATUTORY_CONTRIBUTIONS_SEED) {
      const existing = await this.statutoryRepo.findOne({
        where: { countryId, code: data.code, effectiveFrom: data.effectiveFrom },
      });
      if (existing) continue;

      await this.statutoryRepo.save(this.statutoryRepo.create({ ...data, countryId }));
    }
  }

  private async seedDeductionSections(
    countryId: string,
    regimeIdByCode: Record<string, string>,
  ): Promise<void> {
    for (const data of INDIA_DEDUCTION_SECTIONS_SEED) {
      const regimeId = data.regimeCode ? (regimeIdByCode[data.regimeCode] ?? null) : null;

      const existing = await this.deductionRepo.findOne({
        where: {
          countryId,
          code: data.code,
          regimeId: regimeId as string,
          effectiveFrom: data.effectiveFrom,
        },
      });
      if (existing) continue;

      const { regimeCode: _, ...sectionData } = data;
      await this.deductionRepo.save(
        this.deductionRepo.create({ ...sectionData, countryId, regimeId }),
      );
    }
  }
}
