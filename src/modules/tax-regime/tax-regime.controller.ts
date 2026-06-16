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
import { CreateTaxRegimeDto } from './dto/create-tax-regime.dto';
import { UpdateTaxRegimeDto } from './dto/update-tax-regime.dto';
import { TaxRegimeService } from './tax-regime.service';

@Controller('countries/:countryCode/tax-regimes')
export class TaxRegimeController {
  constructor(private readonly taxRegimeService: TaxRegimeService) {}

  @Post()
  async create(
    @Param('countryCode') countryCode: string,
    @Body() dto: CreateTaxRegimeDto,
  ) {
    dto.countryCode = countryCode;
    return this.taxRegimeService.create(dto);
  }

  @Get()
  async findAll(
    @Param('countryCode') countryCode: string,
    @Query() pagination: PaginationQueryDto,
    @Query('effective_date') effectiveDateStr?: string,
  ) {
    const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : undefined;
    return this.taxRegimeService.findAll(countryCode, pagination, effectiveDate);
  }

  @Get(':regimeCode')
  async findOne(
    @Param('countryCode') countryCode: string,
    @Param('regimeCode') regimeCode: string,
    @Query('effective_date') effectiveDateStr?: string,
  ) {
    const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : undefined;
    return this.taxRegimeService.findByCountryAndCode(
      countryCode,
      regimeCode,
      effectiveDate,
    );
  }

  @Patch(':regimeCode')
  async update(
    @Param('countryCode') countryCode: string,
    @Param('regimeCode') regimeCode: string,
    @Body() dto: UpdateTaxRegimeDto,
  ) {
    return this.taxRegimeService.update(countryCode, regimeCode, dto);
  }

  @Delete(':regimeCode')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('countryCode') countryCode: string,
    @Param('regimeCode') regimeCode: string,
  ): Promise<{ message: string }> {
    await this.taxRegimeService.softDelete(countryCode, regimeCode);
    return { message: 'Tax regime deactivated successfully' };
  }
}
