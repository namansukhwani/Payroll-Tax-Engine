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

export class CreateDeductionSectionDto {
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @IsOptional()
  @IsUUID()
  regimeId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sectionName!: string;

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

  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
