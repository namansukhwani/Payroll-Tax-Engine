import { ComponentType } from '../../../../common/enums/component-type.enum';
import { CalculationType } from '../../../../common/enums/calculation-type.enum';

export interface SalaryComponentSeedData {
  code: string;
  componentName: string;
  componentType: ComponentType;
  calculationType: CalculationType;
  calculationBase: string | null;
  defaultValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  wageCeiling: number | null;
  isTaxable: boolean;
  isMandatory: boolean;
  displayOrder: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
  conditions: Array<{
    conditionType: string;
    conditionOperator: string;
    conditionValue: string;
    overrideValue: number;
    overrideCalculationBase: string | null;
    isActive: boolean;
  }>;
}

export const INDIA_SALARY_COMPONENTS_SEED: SalaryComponentSeedData[] = [
  {
    code: 'BASIC',
    componentName: 'Basic Salary',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'CTC',
    defaultValue: 40,        // 40% of CTC
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: true,
    isMandatory: true,
    displayOrder: 1,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
  },
  {
    code: 'HRA',
    componentName: 'House Rent Allowance',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 50,        // 50% of BASIC (default metro rate)
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: true,         // taxable (exemption calculated at tax stage)
    isMandatory: true,
    displayOrder: 2,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [
      {
        conditionType: 'LOCATION',
        conditionOperator: 'EQ',
        conditionValue: 'METRO',
        overrideValue: 50,    // 50% of BASIC for metro
        overrideCalculationBase: 'BASIC',
        isActive: true,
      },
      {
        conditionType: 'LOCATION',
        conditionOperator: 'EQ',
        conditionValue: 'NON_METRO',
        overrideValue: 40,    // 40% of BASIC for non-metro
        overrideCalculationBase: 'BASIC',
        isActive: true,
      },
    ],
  },
  {
    code: 'SPECIAL_ALLOWANCE',
    componentName: 'Special Allowance',
    componentType: ComponentType.EARNING,
    calculationType: CalculationType.BALANCING,
    calculationBase: 'GROSS',  // GROSS - all other EARNING components
    defaultValue: null,
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: true,
    isMandatory: false,
    displayOrder: 10,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
  },
  {
    code: 'EMPLOYER_EPF',
    componentName: 'Employer PF Contribution',
    componentType: ComponentType.EMPLOYER_CONTRIBUTION,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 12,          // 12% of BASIC
    minValue: null,
    maxValue: null,
    wageCeiling: 180000,       // Annual: 15000/month × 12
    isTaxable: false,
    isMandatory: true,
    displayOrder: 20,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
  },
  {
    code: 'EMPLOYER_ESI',
    componentName: 'Employer ESI Contribution',
    componentType: ComponentType.EMPLOYER_CONTRIBUTION,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'GROSS',
    defaultValue: 3.25,        // 3.25% of GROSS
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: false,
    isMandatory: false,        // conditional on gross <= 21000/month
    displayOrder: 21,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
  },
  {
    code: 'GRATUITY',
    componentName: 'Gratuity',
    componentType: ComponentType.EMPLOYER_CONTRIBUTION,
    calculationType: CalculationType.PERCENTAGE,
    calculationBase: 'BASIC',
    defaultValue: 4.81,        // 4.81% of BASIC
    minValue: null,
    maxValue: null,
    wageCeiling: null,
    isTaxable: false,
    isMandatory: true,
    displayOrder: 22,
    effectiveFrom: new Date('2025-04-01'),
    effectiveTo: null,
    isActive: true,
    conditions: [],
  },
];
