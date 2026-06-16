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

export class CreateTaxCessDto {
  @IsOptional()
  @IsUUID()
  regimeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cessName!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage!: number;

  @IsString()
  @IsNotEmpty()
  appliesOn!: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
