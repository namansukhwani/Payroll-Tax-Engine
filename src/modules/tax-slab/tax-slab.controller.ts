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
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';
import { UpdateTaxSlabDto } from './dto/update-tax-slab.dto';
import { TaxSlabService } from './tax-slab.service';

@Controller('countries/:countryCode/tax-regimes/:regimeId/tax-slabs')
export class TaxSlabController {
  constructor(private readonly taxSlabService: TaxSlabService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('regimeId') regimeId: string,
    @Body() dto: CreateTaxSlabDto,
  ) {
    dto.regimeId = regimeId;
    return this.taxSlabService.create(dto);
  }

  @Get()
  async findByRegime(
    @Param('regimeId') regimeId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.taxSlabService.findByRegime(regimeId, pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.taxSlabService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxSlabDto,
  ) {
    return this.taxSlabService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string): Promise<{ message: string }> {
    await this.taxSlabService.softDelete(id);
    return { message: 'Tax slab deactivated successfully' };
  }
}
