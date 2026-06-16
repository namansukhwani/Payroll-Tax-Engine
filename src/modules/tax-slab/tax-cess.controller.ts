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
import { CreateTaxCessDto } from './dto/create-tax-cess.dto';
import { UpdateTaxCessDto } from './dto/update-tax-cess.dto';
import { TaxCessService } from './tax-cess.service';

@Controller('countries/:countryCode/tax-regimes/:regimeId/tax-cess')
export class TaxCessController {
  constructor(private readonly taxCessService: TaxCessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('regimeId') regimeId: string,
    @Body() dto: CreateTaxCessDto,
  ) {
    dto.regimeId = regimeId;
    return this.taxCessService.create(dto);
  }

  @Get()
  async findByRegime(
    @Param('regimeId') regimeId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.taxCessService.findByRegime(regimeId, pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.taxCessService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxCessDto,
  ) {
    return this.taxCessService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.taxCessService.softDelete(id);
  }
}
