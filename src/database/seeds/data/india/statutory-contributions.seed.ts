import { ContributionSide } from '../../../../common/enums/contribution-side.enum';
import { CalculationType } from '../../../../common/enums/calculation-type.enum';

export interface StatutoryContributionSeedData {
  code: string;
  contributionName: string;
  contributionSide: ContributionSide;
  calculationType: CalculationType;
  calculationBase: string | null;
  ratePercentage: number | null;
  wageCeiling: number | null;
  maxContribution: number | null;
  thresholdMin: number | null;
  thresholdMax: number | null;
  isMandatory: boolean;
  displayOrder: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export const INDIA_STATUTORY_CONTRIBUTIONS_SEED: StatutoryContributionSeedData[] = [
  {
    code: 'EPF_EMPLOYEE',
    contributionName: 'Employee Provident Fund (Employee)',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    ratePercentage: 12,         // 12% of BASIC (monthly)
    wageCeiling: 15000,         // Monthly ceiling: ₹15,000
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: null,
    isMandatory: true,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'EPF_EMPLOYER',
    contributionName: 'Employee Provident Fund (Employer)',
    contributionSide: ContributionSide.EMPLOYER,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    ratePercentage: 12,         // 12% of BASIC (monthly)
    wageCeiling: 15000,         // Monthly ceiling: ₹15,000
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: null,
    isMandatory: true,
    displayOrder: 2,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'ESI_EMPLOYEE',
    contributionName: 'Employee State Insurance (Employee)',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'GROSS',
    ratePercentage: 0.75,       // 0.75% of GROSS monthly
    wageCeiling: null,
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: 21000,        // Only if monthly GROSS ≤ ₹21,000
    isMandatory: false,
    displayOrder: 3,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'ESI_EMPLOYER',
    contributionName: 'Employee State Insurance (Employer)',
    contributionSide: ContributionSide.EMPLOYER,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'GROSS',
    ratePercentage: 3.25,       // 3.25% of GROSS monthly
    wageCeiling: null,
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: 21000,        // Only if monthly GROSS ≤ ₹21,000
    isMandatory: false,
    displayOrder: 4,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'PT_EMPLOYEE',
    contributionName: 'Professional Tax (Employee)',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.FIXED,
    calculationBase: null,
    ratePercentage: 2400,       // ANNUAL fixed amount ₹2,400 (₹200/month)
    wageCeiling: null,
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: null,
    isMandatory: true,
    displayOrder: 5,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'GRATUITY_EMPLOYER',
    contributionName: 'Gratuity (Employer)',
    contributionSide: ContributionSide.EMPLOYER,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    ratePercentage: 4.81,       // 4.81% of BASIC monthly
    wageCeiling: null,
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: null,
    isMandatory: true,
    displayOrder: 6,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
];
