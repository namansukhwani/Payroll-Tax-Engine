import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ConditionOperator } from '../../../common/enums/condition-operator.enum';

export class CreateComponentConditionDto {
  @IsString()
  @IsNotEmpty()
  conditionType!: string;

  @IsEnum(ConditionOperator)
  conditionOperator!: ConditionOperator;

  @IsString()
  @IsNotEmpty()
  conditionValue!: string;

  @IsNumber()
  @Min(0)
  overrideValue!: number;

  @IsOptional()
  @IsString()
  overrideCalculationBase?: string;
}
