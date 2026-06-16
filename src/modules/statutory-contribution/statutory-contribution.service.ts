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
import { ContributionSide } from '../../common/enums/contribution-side.enum';
import { buildEffectiveDateFilter } from '../../common/interfaces/effective-dated.interface';
import { CountryService } from '../country/country.service';
import { CreateStatutoryContributionDto } from './dto/create-statutory-contribution.dto';
import { UpdateStatutoryContributionDto } from './dto/update-statutory-contribution.dto';
import { StatutoryContribution } from './entities/statutory-contribution.entity';

@Injectable()
export class StatutoryContributionService {
  constructor(
    @InjectRepository(StatutoryContribution)
    private readonly repo: Repository<StatutoryContribution>,
    private readonly countryService: CountryService,
  ) {}

  async create(dto: CreateStatutoryContributionDto): Promise<StatutoryContribution> {
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

    const contribution = this.repo.create({
      countryId: country.id,
      code: dto.code,
      contributionName: dto.contributionName,
      contributionSide: dto.contributionSide,
      calculationType: dto.calculationType,
      calculationBase: dto.calculationBase ?? null,
      ratePercentage: dto.ratePercentage ?? null,
      wageCeiling: dto.wageCeiling ?? null,
      maxContribution: dto.maxContribution ?? null,
      thresholdMin: dto.thresholdMin ?? null,
      thresholdMax: dto.thresholdMax ?? null,
      isMandatory: dto.isMandatory ?? true,
      displayOrder: dto.displayOrder,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
    });

    const saved = await this.repo.save(contribution);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { country: true },
    });
  }

  async findAll(
    countryCode: string,
    pagination: PaginationQueryDto,
    contributionSide?: ContributionSide,
  ): Promise<PaginatedResponse<StatutoryContribution>> {
    const country = await this.countryService.findByCode(countryCode);
    const { page, limit } = pagination;

    const qb = this.repo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.country', 'country')
      .where('sc.countryId = :countryId', { countryId: country.id });

    if (contributionSide !== undefined) {
      qb.andWhere('sc.contributionSide = :contributionSide', { contributionSide });
    }

    qb.orderBy('sc.displayOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findById(id: string): Promise<StatutoryContribution> {
    const contribution = await this.repo.findOne({
      where: { id },
      relations: { country: true },
    });

    if (!contribution) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return contribution;
  }

  async findActiveByCountry(
    countryId: string,
    effectiveDate: Date,
  ): Promise<StatutoryContribution[]> {
    let qb = this.repo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.country', 'country')
      .where('sc.countryId = :countryId', { countryId });

    qb = buildEffectiveDateFilter(qb, effectiveDate, 'sc');

    qb.orderBy('sc.displayOrder', 'ASC');

    return qb.getMany();
  }

  async update(
    id: string,
    dto: UpdateStatutoryContributionDto,
  ): Promise<StatutoryContribution> {
    const contribution = await this.findById(id);

    if (dto.contributionName !== undefined) contribution.contributionName = dto.contributionName;
    if (dto.contributionSide !== undefined) contribution.contributionSide = dto.contributionSide;
    if (dto.calculationType !== undefined) contribution.calculationType = dto.calculationType;
    if (dto.calculationBase !== undefined) contribution.calculationBase = dto.calculationBase ?? null;
    if (dto.ratePercentage !== undefined) contribution.ratePercentage = dto.ratePercentage ?? null;
    if (dto.wageCeiling !== undefined) contribution.wageCeiling = dto.wageCeiling ?? null;
    if (dto.maxContribution !== undefined) contribution.maxContribution = dto.maxContribution ?? null;
    if (dto.thresholdMin !== undefined) contribution.thresholdMin = dto.thresholdMin ?? null;
    if (dto.thresholdMax !== undefined) contribution.thresholdMax = dto.thresholdMax ?? null;
    if (dto.isMandatory !== undefined) contribution.isMandatory = dto.isMandatory;
    if (dto.displayOrder !== undefined) contribution.displayOrder = dto.displayOrder;
    if (dto.effectiveFrom !== undefined) contribution.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) contribution.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (dto.isActive !== undefined) contribution.isActive = dto.isActive;

    return this.repo.save(contribution);
  }

  async softDelete(id: string): Promise<void> {
    const contribution = await this.findById(id);
    contribution.isActive = false;
    await this.repo.save(contribution);
  }
}
