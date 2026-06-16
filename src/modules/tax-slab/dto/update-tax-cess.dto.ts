import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTaxCessDto {
  @IsOptional()
  @IsUUID()
  regimeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cessName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  appliesOn?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
