import { Injectable } from '@nestjs/common';
import { StatutoryContribution } from '../../statutory-contribution/entities/statutory-contribution.entity';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { ContributionSide } from '../../../common/enums/contribution-side.enum';

export interface ContributionResult {
  code: string;
  name: string;
  annualAmount: number;
  monthlyAmount: number;
  side: ContributionSide;
}

export interface StatutoryBreakdown {
  employee: Record<string, ContributionResult>;
  employer: Record<string, ContributionResult>;
  employeeTotal: number; // annual
  employerTotal: number; // annual
}

@Injectable()
export class StatutoryCalculatorService {
  calculateContributions(
    salaryResolvedValues: Record<string, number>,
    contributions: StatutoryContribution[],
  ): StatutoryBreakdown {
    const breakdown: StatutoryBreakdown = {
      employee: {},
      employer: {},
      employeeTotal: 0,
      employerTotal: 0,
    };

    // Sort by displayOrder ASC
    const sorted = [...contributions].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    for (const contribution of sorted) {
      // Step 1: Get monthly base
      const baseCode = contribution.calculationBase ?? 'GROSS';
      const annualBase = salaryResolvedValues[baseCode] ?? 0;
      const monthlyBase = annualBase / 12;

      // Step 2: Check threshold eligibility
      if (
        contribution.thresholdMax !== null &&
        monthlyBase > Number(contribution.thresholdMax)
      ) {
        continue;
      }
      if (
        contribution.thresholdMin !== null &&
        monthlyBase < Number(contribution.thresholdMin)
      ) {
        continue;
      }

      // Step 3: Apply wage ceiling
      const effectiveMonthlyBase =
        contribution.wageCeiling !== null
          ? Math.min(monthlyBase, Number(contribution.wageCeiling))
          : monthlyBase;

      // Step 4: Calculate monthly contribution
      let monthlyContrib: number;
      let annualContrib: number;

      if (contribution.calculationType === CalculationType.FIXED) {
        // ratePercentage stores the ANNUAL fixed amount
        annualContrib = Number(contribution.ratePercentage ?? 0);
        monthlyContrib = annualContrib / 12;
      } else {
        // PERCENTAGE (and BALANCING treated as PERCENTAGE here)
        const rate = Number(contribution.ratePercentage ?? 0);
        monthlyContrib = (effectiveMonthlyBase * rate) / 100;
        annualContrib = monthlyContrib * 12;
      }

      // Step 5: Apply maxContribution cap
      if (contribution.maxContribution !== null) {
        annualContrib = Math.min(annualContrib, Number(contribution.maxContribution));
        monthlyContrib = annualContrib / 12;
      }

      // Step 6: Round
      monthlyContrib = Math.round(monthlyContrib * 100) / 100;
      annualContrib = Math.round(monthlyContrib * 12 * 100) / 100;

      // Step 7: Bucket by side
      const result: ContributionResult = {
        code: contribution.code,
        name: contribution.contributionName,
        annualAmount: annualContrib,
        monthlyAmount: monthlyContrib,
        side: contribution.contributionSide,
      };

      if (contribution.contributionSide === ContributionSide.EMPLOYEE) {
        breakdown.employee[contribution.code] = result;
        breakdown.employeeTotal += annualContrib;
      } else {
        breakdown.employer[contribution.code] = result;
        breakdown.employerTotal += annualContrib;
      }
    }

    // Round totals
    breakdown.employeeTotal = Math.round(breakdown.employeeTotal * 100) / 100;
    breakdown.employerTotal = Math.round(breakdown.employerTotal * 100) / 100;

    return breakdown;
  }
}
