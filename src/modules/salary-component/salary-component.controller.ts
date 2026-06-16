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
import { ComponentType } from '../../common/enums/component-type.enum';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { SalaryComponentService } from './salary-component.service';

@Controller('countries/:countryCode/salary-components')
export class SalaryComponentController {
  constructor(private readonly salaryComponentService: SalaryComponentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('countryCode') countryCode: string,
    @Body() dto: CreateSalaryComponentDto,
  ) {
    dto.countryCode = countryCode;
    return this.salaryComponentService.create(dto);
  }

  @Get()
  async findAll(
    @Param('countryCode') countryCode: string,
    @Query() pagination: PaginationQueryDto,
    @Query('effective_date') effectiveDateStr?: string,
    @Query('component_type') componentType?: ComponentType,
    @Query('is_active') isActiveStr?: string,
  ) {
    const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : undefined;
    const isActive =
      isActiveStr === 'true' ? true : isActiveStr === 'false' ? false : undefined;

    return this.salaryComponentService.findAll(countryCode, pagination, {
      effectiveDate,
      componentType,
      isActive,
    });
  }

  @Get(':code')
  async findByCode(
    @Param('countryCode') countryCode: string,
    @Param('code') code: string,
  ) {
    return this.salaryComponentService.findByCode(countryCode, code);
  }

  @Patch(':code')
  async update(
    @Param('countryCode') countryCode: string,
    @Param('code') code: string,
    @Body() dto: UpdateSalaryComponentDto,
  ) {
    return this.salaryComponentService.update(countryCode, code, dto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('countryCode') countryCode: string,
    @Param('code') code: string,
  ): Promise<{ message: string }> {
    await this.salaryComponentService.softDelete(countryCode, code);
    return { message: 'Salary component deactivated successfully' };
  }
}
