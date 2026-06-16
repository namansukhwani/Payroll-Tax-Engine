import { Column, SelectQueryBuilder } from 'typeorm';

export interface IEffectiveDated {
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EffectiveDatedMixin<TBase extends new (...args: any[]) => object>(
  Base: TBase,
) {
  abstract class EffectiveDatedClass extends Base implements IEffectiveDated {
    @Column({ type: 'date' })
    effectiveFrom!: Date;

    @Column({ type: 'date', nullable: true })
    effectiveTo!: Date | null;

    @Column({ default: true })
    isActive!: boolean;
  }
  return EffectiveDatedClass;
}

export function buildEffectiveDateFilter<T extends object>(
  qb: SelectQueryBuilder<T>,
  date: Date,
  alias: string,
): SelectQueryBuilder<T> {
  return qb
    .andWhere(`${alias}.effectiveFrom <= :date`, { date })
    .andWhere(
      `(${alias}.effectiveTo IS NULL OR ${alias}.effectiveTo >= :date)`,
      { date },
    )
    .andWhere(`${alias}.isActive = true`);
}
