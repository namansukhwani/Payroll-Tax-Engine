import { Injectable } from '@nestjs/common';
import { CountryService } from '../../country/country.service';
import { TaxRegimeService } from '../../tax-regime/tax-regime.service';
import { SalaryComponentService } from '../../salary-component/salary-component.service';
import { StatutoryContributionService } from '../../statutory-contribution/statutory-contribution.service';
import { TaxSlabService } from '../../tax-slab/tax-slab.service';
import { TaxSurchargeService } from '../../tax-slab/tax-surcharge.service';
import { TaxCessService } from '../../tax-slab/tax-cess.service';
import { DeductionSectionService } from '../../deduction-section/deduction-section.service';
import { SalaryCalculatorService } from './salary-calculator.service';
import { StatutoryCalculatorService } from './statutory-calculator.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { CurrencyConverterService } from './currency-converter.service';
import { CalculatePayrollDto } from '../dto/calculate-payroll.dto';
import {
  PayrollBreakdown,
  CalculationContext,
  SalaryComponents,
  NetSalary,
  TotalEmployerCost,
} from '../dto/payroll-breakdown.dto';
import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { UnprocessableEntityException } from '@nestjs/common';

@Injectable()
export class CalculationOrchestratorService {
  constructor(
    private readonly countryService: CountryService,
    private readonly taxRegimeService: TaxRegimeService,
    private readonly salaryComponentService: SalaryComponentService,
    private readonly statutoryContributionService: StatutoryContributionService,
    private readonly taxSlabService: TaxSlabService,
    private readonly taxSurchargeService: TaxSurchargeService,
    private readonly taxCessService: TaxCessService,
    private readonly deductionSectionService: DeductionSectionService,
    private readonly salaryCalculator: SalaryCalculatorService,
    private readonly statutoryCalculator: StatutoryCalculatorService,
    private readonly taxCalculator: TaxCalculatorService,
    private readonly currencyConverter: CurrencyConverterService,
  ) {}

  async calculatePayroll(dto: CalculatePayrollDto): Promise<PayrollBreakdown> {
    const effectiveDate = dto.effectiveDate
      ? new Date(dto.effectiveDate)
      : new Date();
    const effectiveDateStr = effectiveDate.toISOString().split('T')[0]!;

    // 1. Load country
    const country = await this.countryService.findByCode(dto.countryCode);

    // 2. Load tax regime
    const regime = await this.taxRegimeService.findByCountryAndCode(
      dto.countryCode,
      dto.taxRegimeCode,
      effectiveDate,
    );

    // 3. Load all active rules in parallel
    const [components, contributions, slabs, surcharges, cessRules, deductions] =
      await Promise.all([
        this.salaryComponentService.findActiveByCountry(country.id, effectiveDate),
        this.statutoryContributionService.findActiveByCountry(country.id, effectiveDate),
        this.taxSlabService.findActiveByRegime(regime.id, effectiveDate),
        this.taxSurchargeService.findActiveByRegime(regime.id, effectiveDate),
        this.taxCessService.findActiveByRegime(regime.id, effectiveDate),
        this.deductionSectionService.findActiveByCountryAndRegime(
          country.id,
          regime.id,
          effectiveDate,
        ),
      ]);

    // 4. Validate rules exist
    if (components.length === 0) {
      throw new UnprocessableEntityException(ErrorCode.NO_ACTIVE_RULES);
    }

    // 5. Build calculation context
    const context: CalculationContext = {
      isMetro: dto.isMetro ?? false,
      employeeAge: dto.employeeAge ?? 30,
    };

    // 6. Calculate salary components
    const salaryBreakdown = this.salaryCalculator.calculateComponents(
      dto.annualCtc,
      components,
      context,
    );

    // 7. Calculate statutory contributions (using resolved salary values)
    const statutoryBreakdown = this.statutoryCalculator.calculateContributions(
      salaryBreakdown.resolvedValues,
      contributions,
    );

    // 8. Calculate tax
    const claimedDeductions = dto.claimedDeductions ?? {};
    const taxDetail = this.taxCalculator.calculateTax(
      salaryBreakdown.grossSalary,
      slabs,
      surcharges,
      cessRules,
      deductions,
      claimedDeductions,
    );

    // 9. Compute net salary and total employer cost
    const annualNetSalary = Math.round(
      (salaryBreakdown.grossSalary - statutoryBreakdown.employeeTotal - taxDetail.totalTax) * 100,
    ) / 100;
    const monthlyNetSalary = Math.round((annualNetSalary / 12) * 100) / 100;

    // totalEmployerCost = CTC (employer contributions are part of CTC structure)
    const annualEmployerCost = dto.annualCtc;
    const monthlyEmployerCost = Math.round((annualEmployerCost / 12) * 100) / 100;

    // 10. Build salary components shape
    const findEarning = (code: string): number =>
      salaryBreakdown.earnings.find((e) => e.code === code)?.annual ?? 0;
    const findEarningMonthly = (code: string): number =>
      salaryBreakdown.earnings.find((e) => e.code === code)?.monthly ?? 0;

    const knownCodes = new Set(['BASIC', 'HRA', 'SPECIAL_ALLOWANCE']);
    const otherAnnualEarnings = salaryBreakdown.earnings
      .filter((e) => !knownCodes.has(e.code))
      .map((e) => ({ code: e.code, name: e.name, amount: e.annual }));
    const otherMonthlyEarnings = salaryBreakdown.earnings
      .filter((e) => !knownCodes.has(e.code))
      .map((e) => ({ code: e.code, name: e.name, amount: e.monthly }));

    const annualSalaryComponents: SalaryComponents = {
      basic: findEarning('BASIC'),
      hra: findEarning('HRA'),
      specialAllowance: findEarning('SPECIAL_ALLOWANCE'),
      otherEarnings: otherAnnualEarnings,
      grossSalary: salaryBreakdown.grossSalary,
    };
    const monthlySalaryComponents: SalaryComponents = {
      basic: findEarningMonthly('BASIC'),
      hra: findEarningMonthly('HRA'),
      specialAllowance: findEarningMonthly('SPECIAL_ALLOWANCE'),
      otherEarnings: otherMonthlyEarnings,
      grossSalary: Math.round((salaryBreakdown.grossSalary / 12) * 100) / 100,
    };

    // 11. Build employer contributions shape
    const annualEmployerContribs: Record<string, number> & { total: number } = { total: 0 };
    const monthlyEmployerContribs: Record<string, number> & { total: number } = { total: 0 };
    for (const [code, result] of Object.entries(statutoryBreakdown.employer)) {
      annualEmployerContribs[code] = result.annualAmount;
      monthlyEmployerContribs[code] = result.monthlyAmount;
    }
    annualEmployerContribs['total'] = statutoryBreakdown.employerTotal;
    monthlyEmployerContribs['total'] = Math.round((statutoryBreakdown.employerTotal / 12) * 100) / 100;

    // 12. Build employee deductions shape
    const annualEmployeeDeductions: Record<string, number> & { total: number } = { total: 0 };
    const monthlyEmployeeDeductions: Record<string, number> & { total: number } = { total: 0 };
    for (const [code, result] of Object.entries(statutoryBreakdown.employee)) {
      annualEmployeeDeductions[code] = result.annualAmount;
      monthlyEmployeeDeductions[code] = result.monthlyAmount;
    }
    annualEmployeeDeductions['total'] = statutoryBreakdown.employeeTotal;
    monthlyEmployeeDeductions['total'] = Math.round((statutoryBreakdown.employeeTotal / 12) * 100) / 100;

    // 14. Assemble breakdown
    const netSalary: NetSalary = {
      annual: annualNetSalary,
      monthly: monthlyNetSalary,
    };
    const totalEmployerCost: TotalEmployerCost = {
      annual: annualEmployerCost,
      monthly: monthlyEmployerCost,
    };

    let breakdown: PayrollBreakdown = {
      country: {
        code: country.code,
        name: country.name,
        currencyCode: country.currencyCode,
        currencySymbol: country.currencySymbol,
        fiscalYearStartMonth: country.fiscalYearStartMonth,
      },
      input: {
        annualCtc: dto.annualCtc,
        taxRegime: {
          code: regime.code,
          name: regime.name,
        },
        isMetro: dto.isMetro ?? false,
        employeeAge: dto.employeeAge ?? 30,
        effectiveDate: effectiveDateStr,
        claimedDeductions,
      },
      salaryBreakdown: {
        annual: annualSalaryComponents,
        monthly: monthlySalaryComponents,
      },
      employerContributions: {
        annual: annualEmployerContribs,
        monthly: monthlyEmployerContribs,
      },
      employeeDeductions: {
        annual: annualEmployeeDeductions,
        monthly: monthlyEmployeeDeductions,
      },
      taxCalculation: taxDetail,
      netSalary,
      totalEmployerCost,
      currency: {
        primary: country.currencyCode,
        converted: null,
      },
    };

    // 14. Optional currency conversion
    if (dto.outputCurrency && dto.outputCurrency !== country.currencyCode) {
      breakdown = await this.currencyConverter.convertBreakdown(
        breakdown,
        country.currencyCode,
        dto.outputCurrency,
      );
    }

    return breakdown;
  }
}
