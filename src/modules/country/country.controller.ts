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
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './entities/country.entity';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCountryDto): Promise<Country> {
    return this.countryService.create(dto);
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('is_active') isActive?: string,
  ): Promise<PaginatedResponse<Country>> {
    const isActiveParsed =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.countryService.findAll(pagination, isActiveParsed);
  }

  @Get(':code')
  async findByCode(@Param('code') code: string): Promise<Country> {
    return this.countryService.findByCode(code);
  }

  @Patch(':code')
  async update(
    @Param('code') code: string,
    @Body() dto: UpdateCountryDto,
  ): Promise<Country> {
    return this.countryService.update(code, dto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('code') code: string): Promise<{ message: string }> {
    await this.countryService.softDelete(code);
    return { message: 'Country deactivated successfully' };
  }
}
