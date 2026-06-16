import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { ComponentType } from '../../../common/enums/component-type.enum';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { Country } from '../../country/entities/country.entity';
import { ComponentCondition } from './component-condition.entity';

@Entity('salary_components')
@Index(['countryId', 'code', 'effectiveFrom'], { unique: true })
@Index(['countryId', 'isActive', 'effectiveFrom'])
export class SalaryComponent extends BaseEntity {
  @Column({ name: 'country_id', type: 'uuid', nullable: false })
  countryId!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  componentName!: string;

  @Column({ name: 'component_type', type: 'enum', enum: ComponentType })
  componentType!: ComponentType;

  @Column({ name: 'calculation_type', type: 'enum', enum: CalculationType })
  calculationType!: CalculationType;

  @Column({ name: 'calculation_base', type: 'varchar', length: 50, nullable: true })
  calculationBase!: string | null;

  @Column({ name: 'default_value', type: 'decimal', precision: 12, scale: 4, nullable: true })
  defaultValue!: number | null;

  @Column({ name: 'min_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  minValue!: number | null;

  @Column({ name: 'max_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxValue!: number | null;

  @Column({ name: 'wage_ceiling', type: 'decimal', precision: 15, scale: 2, nullable: true })
  wageCeiling!: number | null;

  @Column({ name: 'is_taxable', type: 'boolean', default: true })
  isTaxable!: boolean;

  @Column({ name: 'is_mandatory', type: 'boolean', default: true })
  isMandatory!: boolean;

  @Column({ name: 'display_order', type: 'int', nullable: false })
  displayOrder!: number;

  @Column({ name: 'effective_from', type: 'date', nullable: false })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Country, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @OneToMany(() => ComponentCondition, (c) => c.salaryComponent, { cascade: true, eager: false })
  conditions!: ComponentCondition[];
}
