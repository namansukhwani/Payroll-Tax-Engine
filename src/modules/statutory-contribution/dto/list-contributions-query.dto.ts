import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ContributionSide } from '../../../common/enums/contribution-side.enum';

export class ListContributionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ContributionSide)
  contribution_side?: ContributionSide;
}
