import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes.constant';
import {
  PaginatedResponse,
  PaginationQueryDto,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './entities/country.entity';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  async create(dto: CreateCountryDto): Promise<Country> {
    const existing = await this.repo.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(ErrorCode.DUPLICATE_ENTRY);
    }

    const country = this.repo.create({
      ...dto,
      code: dto.code.toUpperCase(),
    });

    return this.repo.save(country);
  }

  async findAll(
    pagination: PaginationQueryDto,
    isActive?: boolean,
  ): Promise<PaginatedResponse<Country>> {
    const { page, limit } = pagination;

    const qb = this.repo.createQueryBuilder('country');

    if (isActive !== undefined) {
      qb.where('country.isActive = :isActive', { isActive });
    }

    qb.orderBy('country.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findByCode(code: string): Promise<Country> {
    const country = await this.repo.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!country) {
      throw new NotFoundException(ErrorCode.COUNTRY_NOT_FOUND);
    }

    return country;
  }

  async update(code: string, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findByCode(code);

    Object.assign(country, dto);

    return this.repo.save(country);
  }

  async softDelete(code: string): Promise<void> {
    const country = await this.findByCode(code);

    country.isActive = false;

    await this.repo.save(country);
  }
}
