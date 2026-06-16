import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentType } from '../../../common/enums/component-type.enum';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { CreateComponentConditionDto } from './create-component-condition.dto';

export class CreateSalaryComponentDto {
  @IsOptional()
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
  componentName!: string;

  @IsEnum(ComponentType)
  componentType!: ComponentType;

  @IsEnum(CalculationType)
  calculationType!: CalculationType;

  @IsOptional()
  @IsString()
  calculationBase?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wageCeiling?: number;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentConditionDto)
  conditions?: CreateComponentConditionDto[];
}
