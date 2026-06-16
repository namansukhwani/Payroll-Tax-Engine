import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ContributionSide } from '../../common/enums/contribution-side.enum';
import { CreateStatutoryContributionDto } from './dto/create-statutory-contribution.dto';
import { UpdateStatutoryContributionDto } from './dto/update-statutory-contribution.dto';
import { StatutoryContributionService } from './statutory-contribution.service';

@Controller('countries/:countryCode/statutory-contributions')
export class StatutoryContributionController {
  constructor(
    private readonly statutoryContributionService: StatutoryContributionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('countryCode') countryCode: string,
    @Body() dto: CreateStatutoryContributionDto,
  ) {
    dto.countryCode = countryCode;
    return this.statutoryContributionService.create(dto);
  }

  @Get()
  async findAll(
    @Param('countryCode') countryCode: string,
    @Query() pagination: PaginationQueryDto,
    @Query('contribution_side') contributionSide?: ContributionSide,
  ) {
    return this.statutoryContributionService.findAll(
      countryCode,
      pagination,
      contributionSide,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.statutoryContributionService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutoryContributionDto,
  ) {
    return this.statutoryContributionService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.statutoryContributionService.softDelete(id);
  }
}
