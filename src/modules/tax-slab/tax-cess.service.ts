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
import { CreateTaxCessDto } from './dto/create-tax-cess.dto';
import { UpdateTaxCessDto } from './dto/update-tax-cess.dto';
import { TaxCess } from './entities/tax-cess.entity';

@Injectable()
export class TaxCessService {
  constructor(
    @InjectRepository(TaxCess)
    private readonly repo: Repository<TaxCess>,
    private readonly taxRegimeService: TaxRegimeService,
  ) {}

  async create(dto: CreateTaxCessDto): Promise<TaxCess> {
    await this.taxRegimeService.findById(dto.regimeId);

    const cess = this.repo.create({
      regimeId: dto.regimeId,
      cessName: dto.cessName,
      ratePercentage: dto.ratePercentage,
      appliesOn: dto.appliesOn,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(cess);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { regime: true },
    });
  }

  async findByRegime(
    regimeId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<TaxCess>> {
    const { page, limit } = pagination;

    const [data, total] = await this.repo
      .createQueryBuilder('taxCess')
      .leftJoinAndSelect('taxCess.regime', 'regime')
      .where('taxCess.regimeId = :regimeId', { regimeId })
      .orderBy('taxCess.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findActiveByRegime(
    regimeId: string,
    effectiveDate: Date,
  ): Promise<TaxCess[]> {
    let qb = this.repo
      .createQueryBuilder('taxCess')
      .leftJoinAndSelect('taxCess.regime', 'regime')
      .where('taxCess.regimeId = :regimeId', { regimeId });

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'taxCess');

    return qb.getMany();
  }

  async findById(id: string): Promise<TaxCess> {
    const cess = await this.repo.findOne({
      where: { id },
      relations: { regime: true },
    });

    if (!cess) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return cess;
  }

  async update(id: string, dto: UpdateTaxCessDto): Promise<TaxCess> {
    const cess = await this.findById(id);

    if (dto.regimeId !== undefined) {
      await this.taxRegimeService.findById(dto.regimeId);
      cess.regimeId = dto.regimeId;
    }
    if (dto.cessName !== undefined) cess.cessName = dto.cessName;
    if (dto.ratePercentage !== undefined) cess.ratePercentage = dto.ratePercentage;
    if (dto.appliesOn !== undefined) cess.appliesOn = dto.appliesOn;
    if (dto.effectiveFrom !== undefined) cess.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) cess.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    return this.repo.save(cess);
  }

  async softDelete(id: string): Promise<void> {
    const cess = await this.findById(id);
    cess.isActive = false;
    await this.repo.save(cess);
  }
}
