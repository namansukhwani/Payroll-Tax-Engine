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

export class CreateStatutoryContributionDto {
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contributionName!: string;

  @IsEnum(ContributionSide)
  contributionSide!: ContributionSide;

  @IsEnum(CalculationType)
  calculationType!: CalculationType;

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

  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
