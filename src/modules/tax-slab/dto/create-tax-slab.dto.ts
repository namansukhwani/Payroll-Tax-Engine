import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateTaxSlabDto {
  @IsOptional()
  @IsUUID()
  regimeId!: string;

  @IsNumber()
  @Min(0)
  minAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage!: number;

  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
