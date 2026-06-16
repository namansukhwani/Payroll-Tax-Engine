export interface DeductionSectionSeedData {
  regimeCode: string | null;   // null = all regimes; will be resolved to regimeId
  code: string;
  sectionName: string;
  description: string | null;
  maxLimit: number | null;
  isApplicableAllRegimes: boolean;
  displayOrder: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export const INDIA_DEDUCTION_SECTIONS_SEED: DeductionSectionSeedData[] = [
  // Standard Deduction — different limits per regime
  {
    regimeCode: 'OLD_REGIME',
    code: 'STANDARD_DEDUCTION',
    sectionName: 'Standard Deduction (Old Regime)',
    description: 'Flat deduction available to all salaried employees under the old tax regime',
    maxLimit: 50000,        // ₹50,000 for Old Regime
    isApplicableAllRegimes: false,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    regimeCode: 'NEW_REGIME',
    code: 'STANDARD_DEDUCTION',
    sectionName: 'Standard Deduction (New Regime)',
    description: 'Flat deduction available to all salaried employees under the new tax regime',
    maxLimit: 75000,        // ₹75,000 for New Regime (Budget 2024)
    isApplicableAllRegimes: false,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  // Old Regime only deductions
  {
    regimeCode: 'OLD_REGIME',
    code: 'SECTION_80C',
    sectionName: 'Section 80C',
    description: 'Investments in PPF, ELSS, LIC premium, EPF, NSC, home loan principal, etc.',
    maxLimit: 150000,       // ₹1,50,000
    isApplicableAllRegimes: false,
    displayOrder: 2,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    regimeCode: 'OLD_REGIME',
    code: 'SECTION_80D',
    sectionName: 'Section 80D',
    description: 'Health insurance premium for self, spouse, children, and parents',
    maxLimit: 25000,        // ₹25,000 (basic; ₹50,000 for senior citizens — simplified)
    isApplicableAllRegimes: false,
    displayOrder: 3,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    regimeCode: 'OLD_REGIME',
    code: 'SECTION_80CCD_1B',
    sectionName: 'Section 80CCD(1B)',
    description: 'Additional NPS contribution over and above 80C limit',
    maxLimit: 50000,        // ₹50,000 additional
    isApplicableAllRegimes: false,
    displayOrder: 4,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
];
