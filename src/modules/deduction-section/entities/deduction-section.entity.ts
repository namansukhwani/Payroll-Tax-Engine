import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { Country } from '../../country/entities/country.entity';
import { TaxRegime } from '../../tax-regime/entities/tax-regime.entity';

@Entity('deduction_sections')
@Index(['countryId', 'code', 'regimeId', 'effectiveFrom'], { unique: true })
@Index(['countryId', 'regimeId', 'isActive'])
export class DeductionSection extends BaseEntity {
  @Column({ name: 'country_id', type: 'uuid', nullable: false })
  countryId!: string;

  @Column({ name: 'regime_id', type: 'uuid', nullable: true })
  regimeId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: false })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  sectionName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'max_limit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maxLimit!: number | null;

  @Column({
    name: 'is_applicable_all_regimes',
    type: 'boolean',
    default: false,
  })
  isApplicableAllRegimes!: boolean;

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

  @ManyToOne(() => TaxRegime, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'regime_id' })
  regime!: TaxRegime | null;
}
