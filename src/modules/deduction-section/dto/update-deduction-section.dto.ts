import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

// All fields from CreateDeductionSectionDto except countryCode and code, all optional.
export class UpdateDeductionSectionDto {
  @IsOptional()
  @IsUUID()
  regimeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sectionName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLimit?: number;

  @IsOptional()
  @IsBoolean()
  isApplicableAllRegimes?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
