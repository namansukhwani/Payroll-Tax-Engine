import {
  IsString,
  IsNotEmpty,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalculatePayrollDto {
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @IsNumber()
  @IsPositive()
  annualCtc!: number;

  @IsString()
  @IsNotEmpty()
  taxRegimeCode!: string;

  @IsOptional()
  @IsBoolean()
  isMetro?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Type(() => Number)
  employeeAge?: number = 30;

  @IsOptional()
  @IsObject()
  claimedDeductions?: Record<string, number>;

  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  outputCurrency?: string;
}
