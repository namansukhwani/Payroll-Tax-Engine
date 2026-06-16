import {
  Column,
  Entity,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/interfaces/base-entity.interface';

@Entity('countries')
export class Country extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 2, unique: true, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, nullable: false })
  currencyCode!: string;

  @Column({ name: 'currency_symbol', type: 'varchar', length: 5, nullable: false })
  currencySymbol!: string;

  @Column({
    name: 'fiscal_year_start_month',
    type: 'smallint',
    nullable: false,
  })
  fiscalYearStartMonth!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
