import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @Length(2, 2)
  @IsUppercase()
  @Matches(/^[A-Z]{2}$/)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Length(3, 3)
  @IsUppercase()
  currencyCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  currencySymbol!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth!: number;

  @IsOptional()
  @IsBoolean()
  isActive: boolean = true;
}
