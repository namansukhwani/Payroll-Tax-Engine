import { Injectable } from '@nestjs/common';
import { CurrencyService } from '../../currency/currency.service';
import {
  PayrollBreakdown,
  SalaryComponents,
  SlabBreakdown,
} from '../dto/payroll-breakdown.dto';

@Injectable()
export class CurrencyConverterService {
  constructor(private readonly currencyService: CurrencyService) {}

  async convertBreakdown(
    breakdown: PayrollBreakdown,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<PayrollBreakdown> {
    if (!toCurrency || toCurrency === fromCurrency) {
      return breakdown;
    }

    const rate = await this.currencyService.getRate(fromCurrency, toCurrency);

    const converted: PayrollBreakdown = JSON.parse(
      JSON.stringify(breakdown),
    ) as PayrollBreakdown;

    const round = (n: number): number => Math.round(n * rate * 100) / 100;

    // Convert salaryBreakdown (annual + monthly)
    for (const period of ['annual', 'monthly'] as const) {
      const sc = converted.salaryBreakdown[period] as SalaryComponents;
      sc.basic = round(sc.basic);
      sc.hra = round(sc.hra);
      sc.specialAllowance = round(sc.specialAllowance);
      sc.grossSalary = round(sc.grossSalary);
      sc.otherEarnings = sc.otherEarnings.map((item) => ({
        ...item,
        amount: round(item.amount),
      }));
    }

    // Convert employerContributions (annual + monthly)
    for (const period of ['annual', 'monthly'] as const) {
      const contrib = converted.employerContributions[period];
      for (const key of Object.keys(contrib)) {
        const val = contrib[key];
        if (typeof val === 'number') {
          contrib[key] = round(val);
        }
      }
    }

    // Convert employeeDeductions (annual + monthly)
    for (const period of ['annual', 'monthly'] as const) {
      const deduct = converted.employeeDeductions[period];
      for (const key of Object.keys(deduct)) {
        const val = deduct[key];
        if (typeof val === 'number') {
          deduct[key] = round(val);
        }
      }
    }

    // Convert taxCalculation scalar fields
    const tc = converted.taxCalculation;
    tc.grossTaxableIncome = round(tc.grossTaxableIncome);
    tc.totalDeductions = round(tc.totalDeductions);
    tc.netTaxableIncome = round(tc.netTaxableIncome);
    tc.baseTax = round(tc.baseTax);
    tc.surcharge = round(tc.surcharge);
    tc.cess = round(tc.cess);
    tc.totalTax = round(tc.totalTax);

    // Convert slab breakdown monetary amounts (taxableAmount, taxAmount)
    // minAmount, maxAmount, and ratePercentage are structural — leave as-is
    tc.slabBreakdown = tc.slabBreakdown.map(
      (slab: SlabBreakdown): SlabBreakdown => ({
        ...slab,
        taxableAmount: round(slab.taxableAmount),
        taxAmount: round(slab.taxAmount),
      }),
    );

    // Convert applied deductions monetary amounts (claimed, applied)
    // code and name are strings — leave as-is
    tc.appliedDeductions = tc.appliedDeductions.map((d) => ({
      ...d,
      claimed: round(d.claimed),
      applied: round(d.applied),
    }));

    // Convert netSalary (annual + monthly)
    converted.netSalary.annual.total = round(converted.netSalary.annual.total);
    converted.netSalary.monthly.total = round(
      converted.netSalary.monthly.total,
    );

    // Convert totalEmployerCost (annual + monthly)
    converted.totalEmployerCost.annual.total = round(
      converted.totalEmployerCost.annual.total,
    );
    converted.totalEmployerCost.monthly.total = round(
      converted.totalEmployerCost.monthly.total,
    );

    // Update currency metadata
    converted.currency.output = toCurrency;
    converted.currency.exchangeRate = rate;

    return converted;
  }
}
