import { SalaryCalculatorService } from './salary-calculator.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { StatutoryCalculatorService } from './statutory-calculator.service';
import { ComponentType } from '../../../common/enums/component-type.enum';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { ContributionSide } from '../../../common/enums/contribution-side.enum';
import { SalaryComponent } from '../../salary-component/entities/salary-component.entity';
import { TaxSlab } from '../../tax-slab/entities/tax-slab.entity';
import { TaxSurcharge } from '../../tax-slab/entities/tax-surcharge.entity';
import { TaxCess } from '../../tax-slab/entities/tax-cess.entity';
import { DeductionSection } from '../../deduction-section/entities/deduction-section.entity';
import { StatutoryContribution } from '../../statutory-contribution/entities/statutory-contribution.entity';

// Helper to build partial SalaryComponent objects for tests
function makeComponent(overrides: Partial<SalaryComponent>): SalaryComponent {
  return {
    id: 'test-id',
    countryId: 'country-id',
    code: 'CODE',
    componentName: 'Component',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.FIXED,
    calculationBase: null,
    defaultValue: 0,
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: true,
    isMandatory: false,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    country: {} as never,
    ...overrides,
  } as SalaryComponent;
}

function makeSlab(overrides: Partial<TaxSlab>): TaxSlab {
  return {
    id: 'slab-id',
    regimeId: 'regime-id',
    minAmount: 0,
    maxAmount: null,
    ratePercentage: 0,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    regime: {} as never,
    ...overrides,
  } as TaxSlab;
}

function makeDeductionSection(overrides: Partial<DeductionSection>): DeductionSection {
  return {
    id: 'section-id',
    countryId: 'country-id',
    regimeId: null,
    code: 'CODE',
    sectionName: 'Section',
    description: null,
    maxLimit: null,
    isApplicableAllRegimes: false,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    country: {} as never,
    regime: null,
    ...overrides,
  } as DeductionSection;
}

function makeContribution(overrides: Partial<StatutoryContribution>): StatutoryContribution {
  return {
    id: 'contrib-id',
    countryId: 'country-id',
    code: 'CODE',
    contributionName: 'Contribution',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'GROSS',
    ratePercentage: 0,
    wageCeiling: null,
    maxContribution: null,
    thresholdMin: null,
    thresholdMax: null,
    isMandatory: false,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    country: {} as never,
    ...overrides,
  } as StatutoryContribution;
}

// India FY2025-26 New Regime components
const INDIA_COMPONENTS: SalaryComponent[] = [
  makeComponent({
    code: 'BASIC',
    componentName: 'Basic Salary',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'CTC',
    defaultValue: 40,
    displayOrder: 1,
  }),
  makeComponent({
    code: 'HRA',
    componentName: 'House Rent Allowance',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 50,
    displayOrder: 2,
    conditions: [
      {
        id: 'c1',
        componentId: 'hra-id',
        conditionType: 'LOCATION',
        conditionOperator: 'EQ',
        conditionValue: 'METRO',
        overrideValue: 50,
        overrideCalculationBase: 'BASIC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        salaryComponent: {} as never,
      },
      {
        id: 'c2',
        componentId: 'hra-id',
        conditionType: 'LOCATION',
        conditionOperator: 'EQ',
        conditionValue: 'NON_METRO',
        overrideValue: 40,
        overrideCalculationBase: 'BASIC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        salaryComponent: {} as never,
      },
    ] as never,
  }),
  makeComponent({
    code: 'SPECIAL_ALLOWANCE',
    componentName: 'Special Allowance',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.BALANCING,
    calculationBase: 'CTC',
    defaultValue: null,
    displayOrder: 10,
  }),
  makeComponent({
    code: 'EMPLOYER_EPF',
    componentName: 'Employer PF',
    componentType: ComponentType.EMPLOYER_CONTRIBUTION,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 12,
    wageCeiling: 180000,
    displayOrder: 20,
  }),
  makeComponent({
    code: 'GRATUITY',
    componentName: 'Gratuity',
    componentType: ComponentType.EMPLOYER_CONTRIBUTION,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 4.81,
    displayOrder: 22,
  }),
];

// India FY2025-26 New Regime tax slabs
const NEW_REGIME_SLABS: TaxSlab[] = [
  makeSlab({ minAmount: 0, maxAmount: 400000, ratePercentage: 0, displayOrder: 1 }),
  makeSlab({ minAmount: 400000, maxAmount: 800000, ratePercentage: 5, displayOrder: 2 }),
  makeSlab({ minAmount: 800000, maxAmount: 1200000, ratePercentage: 10, displayOrder: 3 }),
  makeSlab({ minAmount: 1200000, maxAmount: 1600000, ratePercentage: 15, displayOrder: 4 }),
  makeSlab({ minAmount: 1600000, maxAmount: 2000000, ratePercentage: 20, displayOrder: 5 }),
  makeSlab({ minAmount: 2000000, maxAmount: 2400000, ratePercentage: 25, displayOrder: 6 }),
  makeSlab({ minAmount: 2400000, maxAmount: null, ratePercentage: 30, displayOrder: 7 }),
];

const OLD_REGIME_SLABS: TaxSlab[] = [
  makeSlab({ minAmount: 0, maxAmount: 250000, ratePercentage: 0, displayOrder: 1 }),
  makeSlab({ minAmount: 250000, maxAmount: 500000, ratePercentage: 5, displayOrder: 2 }),
  makeSlab({ minAmount: 500000, maxAmount: 1000000, ratePercentage: 20, displayOrder: 3 }),
  makeSlab({ minAmount: 1000000, maxAmount: null, ratePercentage: 30, displayOrder: 4 }),
];

const NO_SURCHARGES: TaxSurcharge[] = [];

const CESS_RULES: TaxCess[] = [
  {
    id: 'cess-1',
    regimeId: 'regime-id',
    cessName: 'Health & Education Cess',
    ratePercentage: 4,
    appliesOn: 'TAX_PLUS_SURCHARGE',
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    regime: {} as never,
  } as TaxCess,
];

const NEW_REGIME_DEDUCTIONS: DeductionSection[] = [
  makeDeductionSection({
    code: 'STANDARD_DEDUCTION',
    sectionName: 'Standard Deduction (New Regime)',
    maxLimit: 75000,
  }),
];

const OLD_REGIME_DEDUCTIONS: DeductionSection[] = [
  makeDeductionSection({
    code: 'STANDARD_DEDUCTION',
    sectionName: 'Standard Deduction (Old Regime)',
    maxLimit: 50000,
  }),
  makeDeductionSection({
    code: 'SECTION_80C',
    sectionName: 'Section 80C',
    maxLimit: 150000,
    displayOrder: 2,
  }),
];

// Statutory contributions for India
const INDIA_CONTRIBUTIONS: StatutoryContribution[] = [
  makeContribution({
    code: 'EPF_EMPLOYEE',
    contributionName: 'EPF Employee',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    ratePercentage: 12,
    wageCeiling: 15000,
    displayOrder: 1,
  }),
  makeContribution({
    code: 'EPF_EMPLOYER',
    contributionName: 'EPF Employer',
    contributionSide: ContributionSide.EMPLOYER,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    ratePercentage: 12,
    wageCeiling: 15000,
    displayOrder: 2,
  }),
  makeContribution({
    code: 'ESI_EMPLOYEE',
    contributionName: 'ESI Employee',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'GROSS',
    ratePercentage: 0.75,
    thresholdMax: 21000,
    displayOrder: 3,
  }),
  makeContribution({
    code: 'PT_EMPLOYEE',
    contributionName: 'Professional Tax',
    contributionSide: ContributionSide.EMPLOYEE,
    calculationType: CalculationType.FIXED,
    ratePercentage: 2400,
    displayOrder: 5,
  }),
];

describe('SalaryCalculatorService', () => {
  let service: SalaryCalculatorService;

  beforeEach(() => {
    service = new SalaryCalculatorService();
  });

  describe('CTC = 12,00,000 | Metro | New Regime', () => {
    const ctc = 1200000;
    const context = { isMetro: true, employeeAge: 30 };

    it('computes BASIC = 40% of CTC', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      const basic = result.earnings.find((e) => e.code === 'BASIC');
      expect(basic?.annual).toBe(480000);
      expect(basic?.monthly).toBe(40000);
    });

    it('computes HRA = 50% of BASIC for metro', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      const hra = result.earnings.find((e) => e.code === 'HRA');
      expect(hra?.annual).toBe(240000);
    });

    it('computes HRA = 40% of BASIC for non-metro', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, { ...context, isMetro: false });
      const hra = result.earnings.find((e) => e.code === 'HRA');
      expect(hra?.annual).toBe(192000); // 40% of 480000
    });

    it('computes SPECIAL_ALLOWANCE = CTC - BASIC - HRA', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      const sa = result.earnings.find((e) => e.code === 'SPECIAL_ALLOWANCE');
      expect(sa?.annual).toBe(480000); // 1200000 - 480000 - 240000
    });

    it('computes GROSS = CTC (BASIC + HRA + SPECIAL_ALLOWANCE)', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      expect(result.grossSalary).toBe(1200000);
    });

    it('caps EMPLOYER_EPF at wage ceiling (12% of 180000 annual)', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      const epf = result.employerContributions.find((e) => e.code === 'EMPLOYER_EPF');
      expect(epf?.annual).toBe(21600); // 12% of 180000
    });

    it('computes GRATUITY = 4.81% of BASIC', () => {
      const result = service.calculateComponents(ctc, INDIA_COMPONENTS, context);
      const gratuity = result.employerContributions.find((e) => e.code === 'GRATUITY');
      expect(gratuity?.annual).toBe(23088); // 4.81% of 480000
    });
  });
});

describe('StatutoryCalculatorService', () => {
  let service: StatutoryCalculatorService;

  beforeEach(() => {
    service = new StatutoryCalculatorService();
  });

  describe('CTC = 12,00,000 (BASIC=480000, GROSS=1200000)', () => {
    const resolvedValues = { CTC: 1200000, BASIC: 480000, GROSS: 1200000 };

    it('computes EPF_EMPLOYEE capped at 15000/month wage ceiling', () => {
      const result = service.calculateContributions(resolvedValues, INDIA_CONTRIBUTIONS);
      expect(result.employee['EPF_EMPLOYEE'].annualAmount).toBe(21600); // 12% of 15000 × 12
    });

    it('skips ESI_EMPLOYEE when GROSS/month > 21000 threshold', () => {
      const result = service.calculateContributions(resolvedValues, INDIA_CONTRIBUTIONS);
      expect(result.employee['ESI_EMPLOYEE']).toBeUndefined(); // 1200000/12 = 100000 > 21000
    });

    it('computes PT_EMPLOYEE as fixed 2400 annual', () => {
      const result = service.calculateContributions(resolvedValues, INDIA_CONTRIBUTIONS);
      expect(result.employee['PT_EMPLOYEE'].annualAmount).toBe(2400);
    });

    it('sums employee total = EPF + PT = 24000', () => {
      const result = service.calculateContributions(resolvedValues, INDIA_CONTRIBUTIONS);
      expect(result.employeeTotal).toBe(24000);
    });

    it('applies ESI_EMPLOYEE when GROSS/month <= 21000', () => {
      // Low CTC: BASIC=100000, GROSS=252000 (21000/month)
      const lowResolvedValues = { CTC: 252000, BASIC: 100000, GROSS: 252000 };
      const result = service.calculateContributions(lowResolvedValues, INDIA_CONTRIBUTIONS);
      // ESI: 0.75% of 21000/month = 157.5/month → 1890/year
      expect(result.employee['ESI_EMPLOYEE']).toBeDefined();
      expect(result.employee['ESI_EMPLOYEE'].monthlyAmount).toBe(157.5);
    });
  });
});

describe('TaxCalculatorService', () => {
  let service: TaxCalculatorService;

  beforeEach(() => {
    service = new TaxCalculatorService();
  });

  describe('New Regime | CTC = 12,00,000 | no claimed deductions', () => {
    it('auto-applies Standard Deduction of 75000', () => {
      const result = service.calculateTax(1200000, NEW_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, NEW_REGIME_DEDUCTIONS, {});
      expect(result.totalDeductions).toBe(75000);
      expect(result.netTaxableIncome).toBe(1125000);
    });

    it('computes base tax = 52500 (progressive slabs)', () => {
      const result = service.calculateTax(1200000, NEW_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, NEW_REGIME_DEDUCTIONS, {});
      // 0-4L: 0; 4L-8L: 400000×5%=20000; 8L-11.25L: 325000×10%=32500
      expect(result.baseTax).toBe(52500);
    });

    it('computes cess = 2100 (4% of base tax)', () => {
      const result = service.calculateTax(1200000, NEW_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, NEW_REGIME_DEDUCTIONS, {});
      expect(result.cess).toBe(2100);
    });

    it('computes total tax = 54600', () => {
      const result = service.calculateTax(1200000, NEW_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, NEW_REGIME_DEDUCTIONS, {});
      expect(result.totalTax).toBe(54600);
    });
  });

  describe('Old Regime | CTC = 12,00,000 | Section 80C = 150000', () => {
    it('applies Standard Deduction 50000 + 80C 150000 = total 200000', () => {
      const result = service.calculateTax(1200000, OLD_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, OLD_REGIME_DEDUCTIONS, { SECTION_80C: 150000 });
      expect(result.totalDeductions).toBe(200000);
      expect(result.netTaxableIncome).toBe(1000000);
    });

    it('computes base tax = 112500 for 10L taxable income', () => {
      const result = service.calculateTax(1200000, OLD_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, OLD_REGIME_DEDUCTIONS, { SECTION_80C: 150000 });
      // 0-2.5L: 0; 2.5L-5L: 250000×5%=12500; 5L-10L: 500000×20%=100000
      expect(result.baseTax).toBe(112500);
    });

    it('computes total tax = 117000 (baseTax + 4% cess)', () => {
      const result = service.calculateTax(1200000, OLD_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, OLD_REGIME_DEDUCTIONS, { SECTION_80C: 150000 });
      expect(result.totalTax).toBe(117000);
    });

    it('caps 80C deduction at 150000 max limit', () => {
      const result = service.calculateTax(1200000, OLD_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, OLD_REGIME_DEDUCTIONS, { SECTION_80C: 200000 });
      const applied = result.appliedDeductions.find((d) => d.code === 'SECTION_80C');
      expect(applied?.applied).toBe(150000);
      expect(applied?.claimed).toBe(200000);
    });
  });

  describe('New Regime ignores Old-Regime-only deductions', () => {
    it('does not apply Section 80C under New Regime', () => {
      // New Regime deductions only has STANDARD_DEDUCTION, not SECTION_80C
      const result = service.calculateTax(1200000, NEW_REGIME_SLABS, NO_SURCHARGES, CESS_RULES, NEW_REGIME_DEDUCTIONS, { SECTION_80C: 150000 });
      expect(result.totalDeductions).toBe(75000); // only standard deduction
    });
  });

  describe('Net salary computation', () => {
    it('New Regime: net = GROSS - employeeDeductions - tax = 1121400', () => {
      const gross = 1200000;
      const employeeTotal = 24000; // EPF + PT
      const tax = 54600;
      expect(Math.round((gross - employeeTotal - tax) * 100) / 100).toBe(1121400);
    });

    it('Old Regime with 80C: net = 1200000 - 24000 - 117000 = 1059000', () => {
      const gross = 1200000;
      const employeeTotal = 24000;
      const tax = 117000;
      expect(Math.round((gross - employeeTotal - tax) * 100) / 100).toBe(1059000);
    });
  });
});
