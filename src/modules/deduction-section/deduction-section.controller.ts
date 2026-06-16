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
import {
  PaginatedResponse,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { DeductionSectionService } from './deduction-section.service';
import { CreateDeductionSectionDto } from './dto/create-deduction-section.dto';
import { UpdateDeductionSectionDto } from './dto/update-deduction-section.dto';
import { DeductionSection } from './entities/deduction-section.entity';

@Controller('countries/:countryCode/deduction-sections')
export class DeductionSectionController {
  constructor(private readonly deductionSectionService: DeductionSectionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('countryCode') countryCode: string,
    @Body() dto: CreateDeductionSectionDto,
  ): Promise<DeductionSection> {
    dto.countryCode = countryCode;
    return this.deductionSectionService.create(dto);
  }

  @Get()
  async findAll(
    @Param('countryCode') countryCode: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<DeductionSection>> {
    return this.deductionSectionService.findAll(countryCode, pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<DeductionSection> {
    return this.deductionSectionService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDeductionSectionDto,
  ): Promise<DeductionSection> {
    return this.deductionSectionService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.deductionSectionService.softDelete(id);
  }
}
