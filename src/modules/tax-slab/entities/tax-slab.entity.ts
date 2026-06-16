import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { TaxRegime } from '../../tax-regime/entities/tax-regime.entity';

@Entity('tax_slabs')
@Index(['regimeId', 'effectiveFrom', 'isActive'])
export class TaxSlab extends BaseEntity {
  @Column({ name: 'regime_id', type: 'uuid', nullable: false })
  regimeId!: string;

  @Column({ name: 'min_amount', type: 'decimal', precision: 15, scale: 2, nullable: false })
  minAmount!: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAmount!: number | null;

  @Column({ name: 'rate_percentage', type: 'decimal', precision: 5, scale: 2, nullable: false })
  ratePercentage!: number;

  @Column({ name: 'display_order', type: 'int', nullable: false })
  displayOrder!: number;

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
