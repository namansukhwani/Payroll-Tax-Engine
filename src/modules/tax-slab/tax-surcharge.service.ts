import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes.constant';
import {
  PaginatedResponse,
  PaginationQueryDto,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { buildEffectiveDateFilter } from '../../common/interfaces/effective-dated.interface';
import { TaxRegimeService } from '../tax-regime/tax-regime.service';
import { CreateTaxSurchargeDto } from './dto/create-tax-surcharge.dto';
import { UpdateTaxSurchargeDto } from './dto/update-tax-surcharge.dto';
import { TaxSurcharge } from './entities/tax-surcharge.entity';

@Injectable()
export class TaxSurchargeService {
  constructor(
    @InjectRepository(TaxSurcharge)
    private readonly repo: Repository<TaxSurcharge>,
    private readonly taxRegimeService: TaxRegimeService,
  ) {}

  async create(dto: CreateTaxSurchargeDto): Promise<TaxSurcharge> {
    await this.taxRegimeService.findById(dto.regimeId);

    const surcharge = this.repo.create({
      regimeId: dto.regimeId,
      minIncome: dto.minIncome,
      maxIncome: dto.maxIncome ?? null,
      ratePercentage: dto.ratePercentage,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(surcharge);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { regime: true },
    });
  }

  async findByRegime(
    regimeId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<TaxSurcharge>> {
    const { page, limit } = pagination;

    const [data, total] = await this.repo
      .createQueryBuilder('taxSurcharge')
      .leftJoinAndSelect('taxSurcharge.regime', 'regime')
      .where('taxSurcharge.regimeId = :regimeId', { regimeId })
      .orderBy('taxSurcharge.minIncome', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findActiveByRegime(
    regimeId: string,
    effectiveDate: Date,
  ): Promise<TaxSurcharge[]> {
    let qb = this.repo
      .createQueryBuilder('taxSurcharge')
      .leftJoinAndSelect('taxSurcharge.regime', 'regime')
      .where('taxSurcharge.regimeId = :regimeId', { regimeId });

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxSurcharge');

    return qb.orderBy('taxSurcharge.minIncome', 'ASC').getMany();
  }

  async findById(id: string): Promise<TaxSurcharge> {
    const surcharge = await this.repo.findOne({
      where: { id },
      relations: { regime: true },
    });

    if (!surcharge) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return surcharge;
  }

  async update(id: string, dto: UpdateTaxSurchargeDto): Promise<TaxSurcharge> {
    const surcharge = await this.findById(id);

    if (dto.regimeId !== undefined) {
      await this.taxRegimeService.findById(dto.regimeId);
      surcharge.regimeId = dto.regimeId;
    }
    if (dto.minIncome !== undefined) surcharge.minIncome = dto.minIncome;
    if (dto.maxIncome !== undefined) surcharge.maxIncome = dto.maxIncome ?? null;
    if (dto.ratePercentage !== undefined) surcharge.ratePercentage = dto.ratePercentage;
    if (dto.effectiveFrom !== undefined) surcharge.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) surcharge.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    return this.repo.save(surcharge);
  }

  async softDelete(id: string): Promise<void> {
    const surcharge = await this.findById(id);
    surcharge.isActive = false;
    await this.repo.save(surcharge);
  }
}
