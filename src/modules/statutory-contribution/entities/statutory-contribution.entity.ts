import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { CalculationType } from '../../../common/enums/calculation-type.enum';
import { ContributionSide } from '../../../common/enums/contribution-side.enum';
import { Country } from '../../country/entities/country.entity';

@Entity('statutory_contributions')
@Index(['countryId', 'code', 'effectiveFrom'], { unique: true })
@Index(['countryId', 'isActive', 'effectiveFrom'])
export class StatutoryContribution extends BaseEntity {
  @Column({ name: 'country_id', type: 'uuid', nullable: false })
  countryId!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  contributionName!: string;

  @Column({ name: 'contribution_side', type: 'enum', enum: ContributionSide, nullable: false })
  contributionSide!: ContributionSide;

  @Column({ name: 'calculation_type', type: 'enum', enum: CalculationType })
  calculationType!: CalculationType;

  @Column({ name: 'calculation_base', type: 'varchar', length: 50, nullable: true })
  calculationBase!: string | null;

  @Column({ name: 'rate_percentage', type: 'decimal', precision: 5, scale: 4, nullable: true })
  ratePercentage!: number | null;

  @Column({ name: 'wage_ceiling', type: 'decimal', precision: 15, scale: 2, nullable: true })
  wageCeiling!: number | null;

  @Column({ name: 'max_contribution', type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxContribution!: number | null;

  @Column({ name: 'threshold_min', type: 'decimal', precision: 15, scale: 2, nullable: true })
  thresholdMin!: number | null;

  @Column({ name: 'threshold_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  thresholdMax!: number | null;

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
}
