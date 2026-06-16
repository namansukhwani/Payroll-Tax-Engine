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
import { TaxRegimeService } from '../tax-regime/tax-regime.service';
import { CreateDeductionSectionDto } from './dto/create-deduction-section.dto';
import { UpdateDeductionSectionDto } from './dto/update-deduction-section.dto';
import { DeductionSection } from './entities/deduction-section.entity';

@Injectable()
export class DeductionSectionService {
  constructor(
    @InjectRepository(DeductionSection)
    private readonly repo: Repository<DeductionSection>,
    private readonly countryService: CountryService,
    private readonly taxRegimeService: TaxRegimeService,
  ) {}

  async create(dto: CreateDeductionSectionDto): Promise<DeductionSection> {
    const country = await this.countryService.findByCode(dto.countryCode);

    if (dto.regimeId) {
      await this.taxRegimeService.findById(dto.regimeId);
    }

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

    const section = this.repo.create({
      countryId: country.id,
      regimeId: dto.regimeId ?? null,
      code: dto.code,
      sectionName: dto.sectionName,
      description: dto.description ?? null,
      maxLimit: dto.maxLimit ?? null,
      isApplicableAllRegimes: dto.isApplicableAllRegimes ?? false,
      displayOrder: dto.displayOrder,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(section);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { country: true, regime: true },
    });
  }

  async findAll(
    countryCode: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<DeductionSection>> {
    const country = await this.countryService.findByCode(countryCode);
    const { page, limit } = pagination;

    const qb = this.repo
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.country', 'country')
      .leftJoinAndSelect('ds.regime', 'regime')
      .where('ds.countryId = :countryId', { countryId: country.id })
      .orderBy('ds.displayOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findById(id: string): Promise<DeductionSection> {
    const section = await this.repo.findOne({
      where: { id },
      relations: { country: true, regime: true },
    });

    if (!section) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return section;
  }

  async findActiveByCountryAndRegime(
    countryId: string,
    regimeId: string,
    effectiveDate: Date,
  ): Promise<DeductionSection[]> {
    let qb = this.repo
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.country', 'country')
      .leftJoinAndSelect('ds.regime', 'regime')
      .where('ds.countryId = :countryId', { countryId })
      .andWhere(
        '(ds.regimeId = :regimeId OR ds.isApplicableAllRegimes = true)',
        { regimeId },
      );

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'ds');

    qb.orderBy('ds.displayOrder', 'ASC');

    return qb.getMany();
  }

  async update(
    id: string,
    dto: UpdateDeductionSectionDto,
  ): Promise<DeductionSection> {
    const section = await this.findById(id);

    if (dto.regimeId !== undefined) {
      if (dto.regimeId) {
        await this.taxRegimeService.findById(dto.regimeId);
      }
      section.regimeId = dto.regimeId ?? null;
    }
    if (dto.sectionName !== undefined) section.sectionName = dto.sectionName;
    if (dto.description !== undefined) section.description = dto.description ?? null;
    if (dto.maxLimit !== undefined) section.maxLimit = dto.maxLimit ?? null;
    if (dto.isApplicableAllRegimes !== undefined) section.isApplicableAllRegimes = dto.isApplicableAllRegimes;
    if (dto.displayOrder !== undefined) section.displayOrder = dto.displayOrder;
    if (dto.effectiveFrom !== undefined) section.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) section.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (dto.isActive !== undefined) section.isActive = dto.isActive;

    return this.repo.save(section);
  }

  async softDelete(id: string): Promise<void> {
    const section = await this.findById(id);
    section.isActive = false;
    await this.repo.save(section);
  }
}
