export interface TaxSlabSeedData {
  regimeCode: string;          // used to look up regime ID
  minAmount: number;
  maxAmount: number | null;    // null = no upper limit (top slab)
  ratePercentage: number;
  displayOrder: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export interface TaxSurchargeSeedData {
  regimeCode: string;
  minIncome: number;
  maxIncome: number | null;
  ratePercentage: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export interface TaxCessSeedData {
  regimeCode: string;
  cessName: string;
  ratePercentage: number;
  appliesOn: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

// OLD REGIME slabs (FY 2025-26)
// New REGIME slabs (FY 2025-26)
export const INDIA_TAX_SLABS_SEED: TaxSlabSeedData[] = [
  // Old Regime
  { regimeCode: 'OLD_REGIME', minAmount: 0,         maxAmount: 250000,    ratePercentage: 0,  displayOrder: 1, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minAmount: 250001,    maxAmount: 500000,    ratePercentage: 5,  displayOrder: 2, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minAmount: 500001,    maxAmount: 1000000,   ratePercentage: 20, displayOrder: 3, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minAmount: 1000001,   maxAmount: null,      ratePercentage: 30, displayOrder: 4, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },

  // New Regime (FY 2025-26 — revised rates per Union Budget 2025)
  { regimeCode: 'NEW_REGIME', minAmount: 0,         maxAmount: 400000,    ratePercentage: 0,  displayOrder: 1, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 400001,    maxAmount: 800000,    ratePercentage: 5,  displayOrder: 2, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 800001,    maxAmount: 1200000,   ratePercentage: 10, displayOrder: 3, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 1200001,   maxAmount: 1600000,   ratePercentage: 15, displayOrder: 4, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 1600001,   maxAmount: 2000000,   ratePercentage: 20, displayOrder: 5, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 2000001,   maxAmount: 2400000,   ratePercentage: 25, displayOrder: 6, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minAmount: 2400001,   maxAmount: null,      ratePercentage: 30, displayOrder: 7, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
];

// Surcharges — same brackets for both regimes
export const INDIA_TAX_SURCHARGES_SEED: TaxSurchargeSeedData[] = [
  { regimeCode: 'OLD_REGIME', minIncome: 5000000,   maxIncome: 10000000,  ratePercentage: 10, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minIncome: 10000001,  maxIncome: 20000000,  ratePercentage: 15, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minIncome: 20000001,  maxIncome: 50000000,  ratePercentage: 25, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'OLD_REGIME', minIncome: 50000001,  maxIncome: null,      ratePercentage: 37, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },

  { regimeCode: 'NEW_REGIME', minIncome: 5000000,   maxIncome: 10000000,  ratePercentage: 10, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minIncome: 10000001,  maxIncome: 20000000,  ratePercentage: 15, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minIncome: 20000001,  maxIncome: 50000000,  ratePercentage: 25, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', minIncome: 50000001,  maxIncome: null,      ratePercentage: 25, effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
];

// Cess — 4% Health & Education Cess for both regimes
export const INDIA_TAX_CESS_SEED: TaxCessSeedData[] = [
  { regimeCode: 'OLD_REGIME', cessName: 'Health & Education Cess', ratePercentage: 4, appliesOn: 'TAX_PLUS_SURCHARGE', effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
  { regimeCode: 'NEW_REGIME', cessName: 'Health & Education Cess', ratePercentage: 4, appliesOn: 'TAX_PLUS_SURCHARGE', effectiveFrom: new Date('2025-04-01'), effectiveTo: null, isActive: true },
];
