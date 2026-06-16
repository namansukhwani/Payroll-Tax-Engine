import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateTaxSurchargeDto {
  @IsOptional()
  @IsUUID()
  regimeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minIncome?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxIncome?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
