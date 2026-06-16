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
import { ComponentType } from '../../common/enums/component-type.enum';
import { CountryService } from '../country/country.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { ComponentCondition } from './entities/component-condition.entity';
import { SalaryComponent } from './entities/salary-component.entity';

@Injectable()
export class SalaryComponentService {
  constructor(
    @InjectRepository(SalaryComponent)
    private readonly repo: Repository<SalaryComponent>,
    @InjectRepository(ComponentCondition)
    private readonly conditionRepo: Repository<ComponentCondition>,
    private readonly countryService: CountryService,
  ) {}

  async create(dto: CreateSalaryComponentDto): Promise<SalaryComponent> {
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

    const component = this.repo.create({
      countryId: country.id,
      code: dto.code,
      componentName: dto.componentName,
      componentType: dto.componentType,
      calculationType: dto.calculationType,
      calculationBase: dto.calculationBase ?? null,
      defaultValue: dto.defaultValue ?? null,
      minValue: dto.minValue ?? null,
      maxValue: dto.maxValue ?? null,
      wageCeiling: dto.wageCeiling ?? null,
      isTaxable: dto.isTaxable ?? true,
      isMandatory: dto.isMandatory ?? true,
      displayOrder: dto.displayOrder,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: true,
      conditions: (dto.conditions ?? []).map((c) =>
        this.conditionRepo.create({
          conditionType: c.conditionType,
          conditionOperator: c.conditionOperator,
          conditionValue: c.conditionValue,
          overrideValue: c.overrideValue,
          overrideCalculationBase: c.overrideCalculationBase ?? null,
          isActive: true,
        }),
      ),
    });

    const saved = await this.repo.save(component);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { country: true, conditions: true },
    });
  }

  async findAll(
    countryCode: string,
    pagination: PaginationQueryDto,
    filters?: {
      effectiveDate?: Date;
      componentType?: ComponentType;
      isActive?: boolean;
    },
  ): Promise<PaginatedResponse<SalaryComponent>> {
    const country = await this.countryService.findByCode(countryCode);
    const { page, limit } = pagination;

    const qb = this.repo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.country', 'country')
      .leftJoinAndSelect('sc.conditions', 'conditions')
      .where('sc.countryId = :countryId', { countryId: country.id });

    if (filters?.effectiveDate) {
      const date = filters.effectiveDate;
      qb.andWhere('sc.effectiveFrom <= :date', { date })
        .andWhere('(sc.effectiveTo IS NULL OR sc.effectiveTo >= :date)', { date });
    }

    if (filters?.componentType !== undefined) {
      qb.andWhere('sc.componentType = :componentType', { componentType: filters.componentType });
    }

    if (filters?.isActive !== undefined) {
      qb.andWhere('sc.isActive = :isActive', { isActive: filters.isActive });
    }

    qb.orderBy('sc.displayOrder', 'ASC')
      .addOrderBy('sc.effectiveFrom', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findByCode(countryCode: string, code: string): Promise<SalaryComponent> {
    const country = await this.countryService.findByCode(countryCode);

    const component = await this.repo.findOne({
      where: { countryId: country.id, code },
      relations: { country: true, conditions: true },
    });

    if (!component) {
      throw new NotFoundException(ErrorCode.ENTITY_NOT_FOUND);
    }

    return component;
  }

  async findActiveByCountry(countryId: string, effectiveDate: Date): Promise<SalaryComponent[]> {
    return this.repo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.conditions', 'conditions')
      .where('sc.countryId = :countryId', { countryId })
      .andWhere('sc.isActive = true')
      .andWhere('sc.effectiveFrom <= :date', { date: effectiveDate })
      .andWhere('(sc.effectiveTo IS NULL OR sc.effectiveTo >= :date)', { date: effectiveDate })
      .orderBy('sc.displayOrder', 'ASC')
      .getMany();
  }

  async update(
    countryCode: string,
    code: string,
    dto: UpdateSalaryComponentDto,
  ): Promise<SalaryComponent> {
    const component = await this.findByCode(countryCode, code);

    if (dto.componentName !== undefined) component.componentName = dto.componentName;
    if (dto.componentType !== undefined) component.componentType = dto.componentType;
    if (dto.calculationType !== undefined) component.calculationType = dto.calculationType;
    if (dto.calculationBase !== undefined) component.calculationBase = dto.calculationBase ?? null;
    if (dto.defaultValue !== undefined) component.defaultValue = dto.defaultValue ?? null;
    if (dto.minValue !== undefined) component.minValue = dto.minValue ?? null;
    if (dto.maxValue !== undefined) component.maxValue = dto.maxValue ?? null;
    if (dto.wageCeiling !== undefined) component.wageCeiling = dto.wageCeiling ?? null;
    if (dto.isTaxable !== undefined) component.isTaxable = dto.isTaxable;
    if (dto.isMandatory !== undefined) component.isMandatory = dto.isMandatory;
    if (dto.displayOrder !== undefined) component.displayOrder = dto.displayOrder;
    if (dto.effectiveFrom !== undefined) component.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) component.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (dto.isActive !== undefined) component.isActive = dto.isActive;

    if (dto.conditions !== undefined) {
      component.conditions = dto.conditions.map((c) =>
        this.conditionRepo.create({
          conditionType: c.conditionType,
          conditionOperator: c.conditionOperator,
          conditionValue: c.conditionValue,
          overrideValue: c.overrideValue,
          overrideCalculationBase: c.overrideCalculationBase ?? null,
          isActive: true,
        }),
      );
    }

    const saved = await this.repo.save(component);

    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { country: true, conditions: true },
    });
  }

  async softDelete(countryCode: string, code: string): Promise<void> {
    const component = await this.findByCode(countryCode, code);
    component.isActive = false;
    await this.repo.save(component);
  }
}
