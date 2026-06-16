export interface AnnualMonthly<T> {
  annual: T;
  monthly: T;
}

export interface CountryInfo {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  fiscalYearStartMonth: number;
}

export interface TaxRegimeInfo {
  code: string;
  name: string;
}

export interface CalculationInput {
  annualCtc: number;
  taxRegime: TaxRegimeInfo;
  isMetro: boolean;
  employeeAge: number;
  effectiveDate: string;
  claimedDeductions: Record<string, number>;
}

export interface SalaryComponentAmount {
  code: string;
  name: string;
  amount: number;
}

export interface SalaryComponents {
  basic: number;
  hra: number;
  specialAllowance: number;
  otherEarnings: SalaryComponentAmount[];
  grossSalary: number;
}

export interface SlabBreakdown {
  minAmount: number;
  maxAmount: number | null;
  ratePercentage: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxCalculationDetail {
  grossTaxableIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  appliedDeductions: Array<{ code: string; name: string; claimed: number; applied: number }>;
  slabBreakdown: SlabBreakdown[];
  baseTax: number;
  surcharge: number;
  surchargeRate: number;
  cess: number;
  cessRate: number;
  totalTax: number;
  /** Monthly TDS = totalTax / 12, rounded */
  monthlyTds: number;
}

export interface NetSalary {
  annual: number;
  monthly: number;
}

export interface TotalEmployerCost {
  annual: number;
  monthly: number;
}

export interface ConvertedCurrency {
  currencyCode: string;
  exchangeRate: number;
  netSalaryAnnual: number;
  netSalaryMonthly: number;
  totalEmployerCostAnnual: number;
  totalEmployerCostMonthly: number;
}

export interface CurrencyInfo {
  primary: string;
  converted: ConvertedCurrency | null;
}

export interface PayrollBreakdown {
  country: CountryInfo;
  input: CalculationInput;
  salaryBreakdown: AnnualMonthly<SalaryComponents>;
  employerContributions: AnnualMonthly<Record<string, number> & { total: number }>;
  employeeDeductions: AnnualMonthly<Record<string, number> & { total: number }>;
  taxCalculation: TaxCalculationDetail;
  netSalary: NetSalary;
  totalEmployerCost: TotalEmployerCost;
  currency: CurrencyInfo;
}

export interface CalculationContext {
  isMetro: boolean;
  employeeAge: number;
  grossMonthly?: number;
}
