import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';
import { SalaryComponent } from './salary-component.entity';

@Entity('component_conditions')
@Index(['componentId', 'isActive'])
export class ComponentCondition extends BaseEntity {
  @Column({ name: 'component_id', type: 'uuid', nullable: false })
  componentId!: string;

  @Column({ name: 'condition_type', type: 'varchar', length: 50, nullable: false })
  conditionType!: string;

  @Column({ name: 'condition_operator', type: 'varchar', length: 5, nullable: false })
  conditionOperator!: string;

  @Column({ name: 'condition_value', type: 'varchar', length: 100, nullable: false })
  conditionValue!: string;

  @Column({ name: 'override_value', type: 'decimal', precision: 12, scale: 4, nullable: false })
  overrideValue!: number;

  @Column({ name: 'override_calculation_base', type: 'varchar', length: 50, nullable: true })
  overrideCalculationBase!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => SalaryComponent, (s) => s.conditions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  salaryComponent!: SalaryComponent;
}
