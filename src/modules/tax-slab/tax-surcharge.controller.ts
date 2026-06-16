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
import { CreateTaxSurchargeDto } from './dto/create-tax-surcharge.dto';
import { UpdateTaxSurchargeDto } from './dto/update-tax-surcharge.dto';
import { TaxSurchargeService } from './tax-surcharge.service';

@Controller('countries/:countryCode/tax-regimes/:regimeId/tax-surcharges')
export class TaxSurchargeController {
  constructor(private readonly taxSurchargeService: TaxSurchargeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('regimeId') regimeId: string,
    @Body() dto: CreateTaxSurchargeDto,
  ) {
    dto.regimeId = regimeId;
    return this.taxSurchargeService.create(dto);
  }

  @Get()
  async findByRegime(
    @Param('regimeId') regimeId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.taxSurchargeService.findByRegime(regimeId, pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.taxSurchargeService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxSurchargeDto,
  ) {
    return this.taxSurchargeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.taxSurchargeService.softDelete(id);
  }
}
