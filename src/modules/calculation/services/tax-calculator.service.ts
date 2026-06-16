import { Injectable } from '@nestjs/common';
import { TaxSlab } from '../../tax-slab/entities/tax-slab.entity';
import { TaxSurcharge } from '../../tax-slab/entities/tax-surcharge.entity';
import { TaxCess } from '../../tax-slab/entities/tax-cess.entity';
import { DeductionSection } from '../../deduction-section/entities/deduction-section.entity';
import { TaxCalculationDetail, SlabBreakdown } from '../dto/payroll-breakdown.dto';

@Injectable()
export class TaxCalculatorService {
  calculateTax(
    grossSalary: number,
    slabs: TaxSlab[],
    surcharges: TaxSurcharge[],
    cessRules: TaxCess[],
    deductionSections: DeductionSection[],
    claimedDeductions: Record<string, number>,
  ): TaxCalculationDetail {
    // Step 1: grossTaxableIncome
    const grossTaxableIncome = grossSalary;

    // Step 2: Apply deductions
    const appliedDeductions: Array<{ code: string; name: string; claimed: number; applied: number }> = [];
    let totalDeductions = 0;

    for (const [sectionCode, claimedAmount] of Object.entries(claimedDeductions)) {
      const section = deductionSections.find((d) => d.code === sectionCode);
      if (section) {
        let applied = claimedAmount;
        if (section.maxLimit !== null) {
          applied = Math.min(claimedAmount, Number(section.maxLimit));
        }
        appliedDeductions.push({
          code: sectionCode,
          name: section.sectionName,
          claimed: claimedAmount,
          applied,
        });
        totalDeductions += applied;
      }
    }

    // Apply STANDARD_DEDUCTION automatically if present and not already claimed
    const standardDeduction = deductionSections.find((d) => d.code === 'STANDARD_DEDUCTION');
    if (standardDeduction && !('STANDARD_DEDUCTION' in claimedDeductions)) {
      const sdAmount = Number(standardDeduction.maxLimit ?? 0);
      appliedDeductions.push({
        code: 'STANDARD_DEDUCTION',
        name: standardDeduction.sectionName,
        claimed: sdAmount,
        applied: sdAmount,
      });
      totalDeductions += sdAmount;
    }

    const netTaxableIncome = Math.max(0, grossTaxableIncome - totalDeductions);

    // Step 3: Apply progressive tax slabs (sorted by displayOrder ASC)
    const sortedSlabs = [...slabs].sort((a, b) => a.displayOrder - b.displayOrder);
    const slabBreakdown: SlabBreakdown[] = [];
    let baseTax = 0;
    let remainingIncome = netTaxableIncome;

    for (const slab of sortedSlabs) {
      const slabMin = Number(slab.minAmount);
      const slabMax = slab.maxAmount !== null ? Number(slab.maxAmount) : Infinity;
      const rate = Number(slab.ratePercentage);

      let taxableInSlab: number;
      let taxAmount: number;

      if (remainingIncome <= 0 || netTaxableIncome <= slabMin) {
        taxableInSlab = 0;
        taxAmount = 0;
      } else {
        taxableInSlab = Math.min(netTaxableIncome, slabMax) - slabMin;
        taxableInSlab = Math.max(0, taxableInSlab);
        taxAmount = Math.round(taxableInSlab * rate / 100 * 100) / 100;
      }

      slabBreakdown.push({
        minAmount: slabMin,
        maxAmount: slab.maxAmount !== null ? Number(slab.maxAmount) : null,
        ratePercentage: rate,
        taxableAmount: taxableInSlab,
        taxAmount,
      });

      baseTax += taxAmount;
      remainingIncome -= taxableInSlab;
    }

    baseTax = Math.round(baseTax * 100) / 100;

    // Step 4: Apply surcharge
    let surcharge = 0;
    let surchargeRate = 0;

    const applicableSurcharge = surcharges.find(
      (s) =>
        netTaxableIncome > Number(s.minIncome) &&
        (s.maxIncome === null || netTaxableIncome <= Number(s.maxIncome)),
    );

    if (applicableSurcharge) {
      surchargeRate = Number(applicableSurcharge.ratePercentage);
      surcharge = Math.round(baseTax * surchargeRate / 100 * 100) / 100;
    }

    // Step 5: Apply cess
    let cess = 0;
    let cessRate = 0;

    for (const cessRule of cessRules) {
      cessRate = Number(cessRule.ratePercentage);
      if (cessRule.appliesOn === 'TAX_PLUS_SURCHARGE') {
        cess += Math.round((baseTax + surcharge) * cessRate / 100 * 100) / 100;
      } else {
        cess += Math.round(baseTax * cessRate / 100 * 100) / 100;
      }
    }

    cess = Math.round(cess * 100) / 100;

    // Step 6: totalTax
    const totalTax = Math.round((baseTax + surcharge + cess) * 100) / 100;

    // Step 7: Return result
    return {
      grossTaxableIncome,
      totalDeductions,
      netTaxableIncome,
      appliedDeductions,
      slabBreakdown,
      baseTax,
      surcharge,
      surchargeRate,
      cess,
      cessRate,
      totalTax,
    };
  }
}
