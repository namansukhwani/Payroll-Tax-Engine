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
import { buildEffectiveDateFilter } from '../../common/interfaces/effective-dated.interface';
import { CountryService } from '../country/country.service';
import { CreateTaxRegimeDto } from './dto/create-tax-regime.dto';
import { UpdateTaxRegimeDto } from './dto/update-tax-regime.dto';
import { TaxRegime } from './entities/tax-regime.entity';

@Injectable()
export class TaxRegimeService {
  constructor(
    @InjectRepository(TaxRegime)
    private readonly repo: Repository<TaxRegime>,
    private readonly countryService: CountryService,
  ) {}

  async create(dto: CreateTaxRegimeDto): Promise<TaxRegime> {
    const country = await this.countryService.findByCode(dto.countryCode);

    const existing = await this.repo.findOne({
      where: {
        countryId: country.id,
        code: dto.code,
        effectiveFrom: new Date(dto.effectiveFrom) as unknown as Date,
      },
    });

    if (existing) {
      throw new ConflictException(ErrorCode.DUPLICATE_ENTRY);
    }

    const regime = this.repo.create({
      countryId: country.id,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      isDefault: dto.isDefault ?? false,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(regime);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: ['country'],
    });
  }

  async findAll(
    countryCode: string,
    pagination: PaginationQueryDto,
    effectiveDate?: Date,
  ): Promise<PaginatedResponse<TaxRegime>> {
    const country = await this.countryService.findByCode(countryCode);
    const { page, limit } = pagination;

    let qb = this.repo
      .createQueryBuilder('taxRegime')
      .leftJoinAndSelect('taxRegime.country', 'country')
      .where('taxRegime.countryId = :countryId', { countryId: country.id });

    if (effectiveDate) {
      qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxRegime');
    }

    qb.orderBy('taxRegime.effectiveFrom', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findByCountryAndCode(
    countryCode: string,
    regimeCode: string,
    effectiveDate?: Date,
  ): Promise<TaxRegime> {
    const country = await this.countryService.findByCode(countryCode);

    let qb = this.repo
      .createQueryBuilder('taxRegime')
      .leftJoinAndSelect('taxRegime.country', 'country')
      .where('taxRegime.countryId = :countryId', { countryId: country.id })
      .andWhere('taxRegime.code = :code', { code: regimeCode });

    if (effectiveDate) {
      qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxRegime');
    }

    const regime = await qb.getOne();

    if (!regime) {
      throw new NotFoundException(ErrorCode.INVALID_TAX_REGIME);
    }

    return regime;
  }

  async findById(id: string): Promise<TaxRegime> {
    const regime = await this.repo.findOne({
      where: { id },
      relations: ['country'],
    });

    if (!regime) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return regime;
  }

  async findActiveByCountryAndCode(
    countryId: string,
    code: string,
    effectiveDate: Date,
  ): Promise<TaxRegime> {
    let qb = this.repo
      .createQueryBuilder('taxRegime')
      .leftJoinAndSelect('taxRegime.country', 'country')
      .where('taxRegime.countryId = :countryId', { countryId })
      .andWhere('taxRegime.code = :code', { code });

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxRegime');

    const regime = await qb.getOne();

    if (!regime) {
      throw new NotFoundException(ErrorCode.INVALID_TAX_REGIME);
    }

    return regime;
  }

  async update(
    countryCode: string,
    regimeCode: string,
    dto: UpdateTaxRegimeDto,
  ): Promise<TaxRegime> {
    const regime = await this.findByCountryAndCode(countryCode, regimeCode);

    if (dto.name !== undefined) regime.name = dto.name;
    if (dto.description !== undefined) regime.description = dto.description ?? null;
    if (dto.isDefault !== undefined) regime.isDefault = dto.isDefault;
    if (dto.effectiveFrom !== undefined) regime.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) regime.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (dto.isActive !== undefined) regime.isActive = dto.isActive;

    return this.repo.save(regime);
  }

  async softDelete(countryCode: string, regimeCode: string): Promise<void> {
    const regime = await this.findByCountryAndCode(countryCode, regimeCode);
    regime.isActive = false;
    await this.repo.save(regime);
  }
}
