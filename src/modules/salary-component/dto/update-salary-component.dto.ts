import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
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

export class UpdateSalaryComponentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  componentName?: string;

  @IsOptional()
  @IsEnum(ComponentType)
  componentType?: ComponentType;

  @IsOptional()
  @IsEnum(CalculationType)
  calculationType?: CalculationType;

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
  isTaxable?: boolean;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentConditionDto)
  conditions?: CreateComponentConditionDto[];
}
