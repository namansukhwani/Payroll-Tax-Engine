export const INDIA_TAX_REGIMES_SEED = [
  {
    code: 'OLD_REGIME',
    name: 'Old Tax Regime',
    description: 'Traditional tax regime with deductions and exemptions (Section 80C, 80D, HRA exemption, etc.)',
    isDefault: false,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
  {
    code: 'NEW_REGIME',
    name: 'New Tax Regime',
    description: 'Simplified tax regime with lower slab rates but no deductions (except Standard Deduction of ₹75,000)',
    isDefault: true,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
  },
];
