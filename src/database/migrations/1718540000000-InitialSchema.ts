import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1718540000000 implements MigrationInterface {
  name = 'InitialSchema1718540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(`
      CREATE TYPE "component_type_enum" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION')
    `);
    await queryRunner.query(`
      CREATE TYPE "calculation_type_enum" AS ENUM ('PERCENTAGE', 'FIXED', 'BALANCING')
    `);
    await queryRunner.query(`
      CREATE TYPE "contribution_side_enum" AS ENUM ('EMPLOYEE', 'EMPLOYER')
    `);

    // countries
    await queryRunner.query(`
      CREATE TABLE "countries" (
        "id"                       UUID        NOT NULL DEFAULT gen_random_uuid(),
        "code"                     VARCHAR(2)  NOT NULL,
        "name"                     VARCHAR(100) NOT NULL,
        "currency_code"            VARCHAR(3)  NOT NULL,
        "currency_symbol"          VARCHAR(5)  NOT NULL,
        "fiscal_year_start_month"  SMALLINT    NOT NULL,
        "is_active"                BOOLEAN     NOT NULL DEFAULT true,
        "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_countries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_countries_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_countries_code" ON "countries" ("code")`);

    // tax_regimes
    await queryRunner.query(`
      CREATE TABLE "tax_regimes" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "country_id"     UUID         NOT NULL,
        "code"           VARCHAR(50)  NOT NULL,
        "name"           VARCHAR(100) NOT NULL,
        "description"    TEXT,
        "is_default"     BOOLEAN      NOT NULL DEFAULT false,
        "effective_from" DATE         NOT NULL,
        "effective_to"   DATE,
        "is_active"      BOOLEAN      NOT NULL DEFAULT true,
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tax_regimes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tax_regimes_country" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_tax_regimes_country_code_eff"
        ON "tax_regimes" ("country_id", "code", "effective_from")
    `);
    await queryRunner.query(`CREATE INDEX "idx_tax_regimes_country" ON "tax_regimes" ("country_id")`);

    // salary_components
    await queryRunner.query(`
      CREATE TABLE "salary_components" (
        "id"               UUID                     NOT NULL DEFAULT gen_random_uuid(),
        "country_id"       UUID                     NOT NULL,
        "code"             VARCHAR(50)              NOT NULL,
        "name"             VARCHAR(100)             NOT NULL,
        "component_type"   "component_type_enum"    NOT NULL,
        "calculation_type" "calculation_type_enum"  NOT NULL,
        "calculation_base" VARCHAR(50),
        "default_value"    DECIMAL(12,4),
        "min_value"        DECIMAL(15,2),
        "max_value"        DECIMAL(15,2),
        "wage_ceiling"     DECIMAL(15,2),
        "is_taxable"       BOOLEAN                  NOT NULL DEFAULT true,
        "is_mandatory"     BOOLEAN                  NOT NULL DEFAULT true,
        "display_order"    INT                      NOT NULL,
        "effective_from"   DATE                     NOT NULL,
        "effective_to"     DATE,
        "is_active"        BOOLEAN                  NOT NULL DEFAULT true,
        "created_at"       TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_salary_components" PRIMARY KEY ("id"),
        CONSTRAINT "FK_salary_components_country" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_salary_comp_country_code_eff"
        ON "salary_components" ("country_id", "code", "effective_from")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_salary_comp_country_active"
        ON "salary_components" ("country_id", "is_active", "effective_from")
    `);

    // component_conditions
    await queryRunner.query(`
      CREATE TABLE "component_conditions" (
        "id"                         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "component_id"               UUID        NOT NULL,
        "condition_type"             VARCHAR(50) NOT NULL,
        "condition_operator"         VARCHAR(5)  NOT NULL,
        "condition_value"            VARCHAR(100) NOT NULL,
        "override_value"             DECIMAL(12,4) NOT NULL,
        "override_calculation_base"  VARCHAR(50),
        "is_active"                  BOOLEAN     NOT NULL DEFAULT true,
        "created_at"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_component_conditions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_component_conditions_component" FOREIGN KEY ("component_id")
          REFERENCES "salary_components" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_comp_conditions_component"
        ON "component_conditions" ("component_id", "is_active")
    `);

    // tax_slabs
    await queryRunner.query(`
      CREATE TABLE "tax_slabs" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "regime_id"        UUID          NOT NULL,
        "min_amount"       DECIMAL(15,2) NOT NULL,
        "max_amount"       DECIMAL(15,2),
        "rate_percentage"  DECIMAL(5,2)  NOT NULL,
        "display_order"    INT           NOT NULL,
        "effective_from"   DATE          NOT NULL,
        "effective_to"     DATE,
        "is_active"        BOOLEAN       NOT NULL DEFAULT true,
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tax_slabs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tax_slabs_regime" FOREIGN KEY ("regime_id")
          REFERENCES "tax_regimes" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tax_slabs_regime_eff"
        ON "tax_slabs" ("regime_id", "effective_from", "is_active")
    `);

    // tax_surcharges
    await queryRunner.query(`
      CREATE TABLE "tax_surcharges" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "regime_id"        UUID          NOT NULL,
        "min_income"       DECIMAL(15,2) NOT NULL,
        "max_income"       DECIMAL(15,2),
        "rate_percentage"  DECIMAL(5,2)  NOT NULL,
        "effective_from"   DATE          NOT NULL,
        "effective_to"     DATE,
        "is_active"        BOOLEAN       NOT NULL DEFAULT true,
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tax_surcharges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tax_surcharges_regime" FOREIGN KEY ("regime_id")
          REFERENCES "tax_regimes" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tax_surcharges_regime"
        ON "tax_surcharges" ("regime_id", "effective_from", "is_active")
    `);

    // tax_cess_rules
    await queryRunner.query(`
      CREATE TABLE "tax_cess_rules" (
        "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
        "regime_id"        UUID         NOT NULL,
        "name"             VARCHAR(100) NOT NULL,
        "rate_percentage"  DECIMAL(5,2) NOT NULL,
        "applies_on"       VARCHAR(50)  NOT NULL,
        "effective_from"   DATE         NOT NULL,
        "effective_to"     DATE,
        "is_active"        BOOLEAN      NOT NULL DEFAULT true,
        "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tax_cess_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tax_cess_rules_regime" FOREIGN KEY ("regime_id")
          REFERENCES "tax_regimes" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tax_cess_regime"
        ON "tax_cess_rules" ("regime_id", "effective_from", "is_active")
    `);

    // statutory_contributions
    await queryRunner.query(`
      CREATE TABLE "statutory_contributions" (
        "id"                  UUID                      NOT NULL DEFAULT gen_random_uuid(),
        "country_id"          UUID                      NOT NULL,
        "code"                VARCHAR(50)               NOT NULL,
        "name"                VARCHAR(100)              NOT NULL,
        "contribution_side"   "contribution_side_enum"  NOT NULL,
        "calculation_type"    "calculation_type_enum"   NOT NULL,
        "calculation_base"    VARCHAR(50),
        "rate_percentage"     DECIMAL(10,4),
        "wage_ceiling"        DECIMAL(15,2),
        "max_contribution"    DECIMAL(15,2),
        "threshold_min"       DECIMAL(15,2),
        "threshold_max"       DECIMAL(15,2),
        "is_mandatory"        BOOLEAN                   NOT NULL DEFAULT true,
        "display_order"       INT                       NOT NULL,
        "effective_from"      DATE                      NOT NULL,
        "effective_to"        DATE,
        "is_active"           BOOLEAN                   NOT NULL DEFAULT true,
        "created_at"          TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_statutory_contributions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_statutory_contributions_country" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_stat_contrib_country_code_eff"
        ON "statutory_contributions" ("country_id", "code", "effective_from")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_stat_contrib_country_active"
        ON "statutory_contributions" ("country_id", "is_active", "effective_from")
    `);

    // deduction_sections
    await queryRunner.query(`
      CREATE TABLE "deduction_sections" (
        "id"                         UUID          NOT NULL DEFAULT gen_random_uuid(),
        "country_id"                 UUID          NOT NULL,
        "regime_id"                  UUID,
        "code"                       VARCHAR(50)   NOT NULL,
        "name"                       VARCHAR(100)  NOT NULL,
        "description"                TEXT,
        "max_limit"                  DECIMAL(15,2),
        "is_applicable_all_regimes"  BOOLEAN       NOT NULL DEFAULT false,
        "display_order"              INT           NOT NULL,
        "effective_from"             DATE          NOT NULL,
        "effective_to"               DATE,
        "is_active"                  BOOLEAN       NOT NULL DEFAULT true,
        "created_at"                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_deduction_sections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deduction_sections_country" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_deduction_sections_regime" FOREIGN KEY ("regime_id")
          REFERENCES "tax_regimes" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_deduction_country_code_eff"
        ON "deduction_sections" ("country_id", "code", "regime_id", "effective_from")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_deduction_country_regime"
        ON "deduction_sections" ("country_id", "regime_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deduction_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "statutory_contributions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_cess_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_surcharges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_slabs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "component_conditions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_components"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_regimes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contribution_side_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "calculation_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "component_type_enum"`);
  }
}
