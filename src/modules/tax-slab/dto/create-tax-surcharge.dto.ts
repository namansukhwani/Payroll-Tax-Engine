import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateTaxSurchargeDto {
  @IsUUID()
  regimeId!: string;

  @IsNumber()
  @Min(0)
  minIncome!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxIncome?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
