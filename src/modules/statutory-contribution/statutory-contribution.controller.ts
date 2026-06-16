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
import { CreateStatutoryContributionDto } from './dto/create-statutory-contribution.dto';
import { ListContributionsQueryDto } from './dto/list-contributions-query.dto';
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
    @Query() query: ListContributionsQueryDto,
  ) {
    return this.statutoryContributionService.findAll(
      countryCode,
      query,
      query.contribution_side,
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
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string): Promise<{ message: string }> {
    await this.statutoryContributionService.softDelete(id);
    return { message: 'Statutory contribution deactivated successfully' };
  }
}
