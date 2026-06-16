import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListDeductionSectionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  regime_id?: string;
}
