import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { ContributionSide } from '../../../common/enums/contribution-side.enum';

// All fields from CreateStatutoryContributionDto except countryCode and code, all @IsOptional()
export class UpdateStatutoryContributionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contributionName?: string;

  @IsOptional()
  @IsEnum(ContributionSide)
  contributionSide?: ContributionSide;

  @IsOptional()
  @IsEnum(CalculationType)
  calculationType?: CalculationType;

  @IsOptional()
  @IsString()
  calculationBase?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wageCeiling?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxContribution?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  thresholdMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  thresholdMax?: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

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
