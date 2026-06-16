import { Injectable } from '@nestjs/common';
import { SalaryComponent } from '../../salary-component/entities/salary-component.entity';
import { ComponentType } from '../../../common/enums/component-type.enum';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { CalculationContext } from '../dto/payroll-breakdown.dto';

export interface SalaryBreakdownItem {
  code: string;
  name: string;
  annual: number;
  monthly: number;
}

export interface SalaryBreakdown {
  resolvedValues: Record<string, number>;
  earnings: SalaryBreakdownItem[];
  deductions: SalaryBreakdownItem[];
  employerContributions: SalaryBreakdownItem[];
  grossSalary: number;
}

@Injectable()
export class SalaryCalculatorService {
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toItem(component: SalaryComponent, annualValue: number): SalaryBreakdownItem {
    return {
      code: component.code,
      name: component.componentName,
      annual: this.round2(annualValue),
      monthly: this.round2(annualValue / 12),
    };
  }

  private evaluateCondition(
    conditionType: string,
    conditionOperator: string,
    conditionValue: string,
    context: CalculationContext,
  ): boolean {
    if (conditionType === 'LOCATION') {
      const contextLocation = context.isMetro ? 'METRO' : 'NON_METRO';
      // LOCATION is always a string equality check
      switch (conditionOperator) {
        case 'EQ':
          return contextLocation === conditionValue;
        default:
          return false;
      }
    }

    if (conditionType === 'AGE') {
      const age = context.employeeAge;
      const threshold = Number(conditionValue);
      switch (conditionOperator) {
        case 'EQ':
          return age === threshold;
        case 'LT':
          return age < threshold;
        case 'LTE':
          return age <= threshold;
        case 'GT':
          return age > threshold;
        case 'GTE':
          return age >= threshold;
        default:
          return false;
      }
    }

    if (conditionType === 'GROSS_MONTHLY') {
      if (context.grossMonthly === undefined) {
        // Cannot evaluate at component calculation time — skip
        return false;
      }
      const gross = context.grossMonthly;
      const threshold = Number(conditionValue);
      switch (conditionOperator) {
        case 'EQ':
          return gross === threshold;
        case 'LT':
          return gross < threshold;
        case 'LTE':
          return gross <= threshold;
        case 'GT':
          return gross > threshold;
        case 'GTE':
          return gross >= threshold;
        default:
          return false;
      }
    }

    return false;
  }

  calculateComponents(
    annualCtc: number,
    components: SalaryComponent[],
    context: CalculationContext,
  ): SalaryBreakdown {
    // Step 1: Sort by displayOrder ASC
    const sorted = [...components].sort((a, b) => a.displayOrder - b.displayOrder);

    // Step 2: Initialize resolvedValues
    const resolvedValues: Record<string, number> = { CTC: annualCtc };

    // Step 3: Separate BALANCING from non-BALANCING
    const balancingComponents = sorted.filter(
      (c) => c.calculationType === CalculationType.BALANCING,
    );
    const nonBalancingComponents = sorted.filter(
      (c) => c.calculationType !== CalculationType.BALANCING,
    );

    // Accumulators
    const earnings: SalaryBreakdownItem[] = [];
    const deductions: SalaryBreakdownItem[] = [];
    const employerContributions: SalaryBreakdownItem[] = [];

    // Step 4: Process non-BALANCING components
    for (const c of nonBalancingComponents) {
      const defaultValue = Number(c.defaultValue ?? 0);
      const calculationBase = c.calculationBase ?? 'CTC';

      let base = 0;
      let value = 0;
      let rate = defaultValue; // used for PERCENTAGE recalculation after wageCeiling

      if (c.calculationType === CalculationType.PERCENTAGE) {
        base = resolvedValues[calculationBase] ?? 0;
        rate = defaultValue;
        value = this.round2((base * rate) / 100);
      } else {
        // FIXED
        value = defaultValue;
      }

      // Step 4b: Apply active conditions
      const activeConditions = (c.conditions ?? []).filter((cond) => cond.isActive);
      for (const cond of activeConditions) {
        const matches = this.evaluateCondition(
          cond.conditionType,
          cond.conditionOperator,
          cond.conditionValue,
          context,
        );

        if (matches) {
          const overrideValue = Number(cond.overrideValue);

          if (c.calculationType === CalculationType.PERCENTAGE) {
            const overrideBase =
              resolvedValues[
                cond.overrideCalculationBase ?? c.calculationBase ?? 'CTC'
              ] ?? 0;
            base = overrideBase;
            rate = overrideValue;
            value = this.round2((overrideBase * overrideValue) / 100);
          } else {
            // FIXED type override
            value = overrideValue;
          }
          break;
        }
      }

      // Step 4c: Apply wageCeiling (only meaningful for PERCENTAGE)
      if (c.calculationType === CalculationType.PERCENTAGE && c.wageCeiling !== null) {
        const wageCeiling = Number(c.wageCeiling);
        if (base > wageCeiling) {
          base = wageCeiling;
          value = this.round2((base * rate) / 100);
        }
      }

      // Step 4d: Apply minValue/maxValue caps
      if (c.minValue !== null) {
        value = Math.max(value, Number(c.minValue));
      }
      if (c.maxValue !== null) {
        value = Math.min(value, Number(c.maxValue));
      }
      value = this.round2(value);

      // Step 4e: Store
      resolvedValues[c.code] = value;

      // Step 4f: Classify
      const item = this.toItem(c, value);
      if (c.componentType === ComponentType.EARNING) {
        earnings.push(item);
      } else if (c.componentType === ComponentType.DEDUCTION) {
        deductions.push(item);
      } else if (c.componentType === ComponentType.EMPLOYER_CONTRIBUTION) {
        employerContributions.push(item);
      }
    }

    // Step 5: Compute grossSalary = sum of all EARNING component values
    let grossSalary = earnings.reduce((sum, e) => sum + e.annual, 0);
    grossSalary = this.round2(grossSalary);
    resolvedValues['GROSS'] = grossSalary;

    // Step 6: Process BALANCING components
    for (const c of balancingComponents) {
      const balancingBase = c.calculationBase ?? 'GROSS';
      const base = resolvedValues[balancingBase] ?? 0;

      // Sum all other (non-BALANCING) earnings
      const otherEarnings = earnings.reduce((sum, e) => sum + e.annual, 0);

      let value = this.round2(base - otherEarnings);
      value = Math.max(0, value);

      // Apply minValue/maxValue caps
      if (c.minValue !== null) {
        value = Math.max(value, Number(c.minValue));
      }
      if (c.maxValue !== null) {
        value = Math.min(value, Number(c.maxValue));
      }
      value = this.round2(value);

      resolvedValues[c.code] = value;

      const item = this.toItem(c, value);
      earnings.push(item);

      // Update grossSalary to include BALANCING component
      grossSalary = this.round2(grossSalary + value);
      resolvedValues['GROSS'] = grossSalary;
    }

    // Step 7: Build and return SalaryBreakdown
    return {
      resolvedValues,
      earnings,
      deductions,
      employerContributions,
      grossSalary,
    };
  }
}
