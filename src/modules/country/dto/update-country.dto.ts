import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// code is intentionally omitted — it is immutable after creation
export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsUppercase()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  currencySymbol?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
