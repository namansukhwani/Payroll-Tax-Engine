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
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';
import { UpdateTaxSlabDto } from './dto/update-tax-slab.dto';
import { TaxSlab } from './entities/tax-slab.entity';

@Injectable()
export class TaxSlabService {
  constructor(
    @InjectRepository(TaxSlab)
    private readonly repo: Repository<TaxSlab>,
    private readonly taxRegimeService: TaxRegimeService,
  ) {}

  async create(dto: CreateTaxSlabDto): Promise<TaxSlab> {
    await this.taxRegimeService.findById(dto.regimeId);

    const slab = this.repo.create({
      regimeId: dto.regimeId,
      minAmount: dto.minAmount,
      maxAmount: dto.maxAmount ?? null,
      ratePercentage: dto.ratePercentage,
      displayOrder: dto.displayOrder,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(slab);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { regime: true },
    });
  }

  async findByRegime(
    regimeId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<TaxSlab>> {
    const { page, limit } = pagination;

    const [data, total] = await this.repo
      .createQueryBuilder('taxSlab')
      .leftJoinAndSelect('taxSlab.regime', 'regime')
      .where('taxSlab.regimeId = :regimeId', { regimeId })
      .orderBy('taxSlab.displayOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findActiveByRegime(
    regimeId: string,
    effectiveDate: Date,
  ): Promise<TaxSlab[]> {
    let qb = this.repo
      .createQueryBuilder('taxSlab')
      .leftJoinAndSelect('taxSlab.regime', 'regime')
      .where('taxSlab.regimeId = :regimeId', { regimeId });

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxSlab');

    return qb.orderBy('taxSlab.displayOrder', 'ASC').getMany();
  }

  async findById(id: string): Promise<TaxSlab> {
    const slab = await this.repo.findOne({
      where: { id },
      relations: { regime: true },
    });

    if (!slab) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return slab;
  }

  async update(id: string, dto: UpdateTaxSlabDto): Promise<TaxSlab> {
    const slab = await this.findById(id);

    if (dto.regimeId !== undefined) {
      await this.taxRegimeService.findById(dto.regimeId);
      slab.regimeId = dto.regimeId;
    }
    if (dto.minAmount !== undefined) slab.minAmount = dto.minAmount;
    if (dto.maxAmount !== undefined) slab.maxAmount = dto.maxAmount ?? null;
    if (dto.ratePercentage !== undefined) slab.ratePercentage = dto.ratePercentage;
    if (dto.displayOrder !== undefined) slab.displayOrder = dto.displayOrder;
    if (dto.effectiveFrom !== undefined) slab.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) slab.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    return this.repo.save(slab);
  }

  async softDelete(id: string): Promise<void> {
    const slab = await this.findById(id);
    slab.isActive = false;
    await this.repo.save(slab);
  }
}
