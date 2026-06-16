import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { TaxRegime } from '../../tax-regime/entities/tax-regime.entity';

@Entity('tax_cess_rules')
@Index(['regimeId', 'effectiveFrom', 'isActive'])
export class TaxCess extends BaseEntity {
  @Column({ name: 'regime_id', type: 'uuid', nullable: false })
  regimeId!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  cessName!: string;

  @Column({ name: 'rate_percentage', type: 'decimal', precision: 5, scale: 2, nullable: false })
  ratePercentage!: number;

  @Column({ name: 'applies_on', type: 'varchar', length: 50, nullable: false })
  appliesOn!: string;

  @Column({ name: 'effective_from', type: 'date', nullable: false })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => TaxRegime, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regime_id' })
  regime!: TaxRegime;
}
