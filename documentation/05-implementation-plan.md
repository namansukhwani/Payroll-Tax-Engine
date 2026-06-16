# Payroll Tax Engine — Implementation Plan

> **Version**: 1.0.0  
> **Date**: 2026-06-16  
> **Stack**: NestJS · TypeORM · PostgreSQL · TypeScript (strict)  

---

## Approach

Build a stateless, modular NestJS payroll tax engine in 7 phases. Foundation first (project scaffold, DB, common layer), then CRUD modules in parallel, then the calculation engine, seeds, and final integration testing. Each phase has explicit deliverables and verification gates.

## Scope

**In:**
- NestJS project scaffold with strict TypeScript
- PostgreSQL + TypeORM setup with migrations
- Common layer (enums, DTOs, filters, interceptors, constants)
- 8 CRUD modules (country, tax-regime, salary-component, tax-slab, tax-surcharge, tax-cess, statutory-contribution, deduction-section)
- Calculation engine module (orchestrator + 4 sub-calculators)
- Currency module with static exchange rates + `ExchangeRateProvider` interface
- India seed data (FY 2025–26)
- Health check endpoint
- Input validation via `class-validator`
- Global exception filter with structured error responses

**Out:**
- Authentication / Authorization
- Frontend / Admin UI
- Payslip PDF generation
- Batch processing
- Unit / E2E tests (deferred — structure ready, tests written post-MVP)
- CI/CD pipeline
- Docker / Deployment config

---

## Parallelism Map

```
Phase 1 ──────────────────────────────────────────────────────── Sequential
  (Project scaffold, config, database setup)

Phase 2 ──────────────────────────────────────────────────────── Sequential
  (Common layer — all modules depend on this)

Phase 3 ──────────────────────────────────────────────────────── PARALLEL ✦
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ 3A: Country      │  │ 3B: Tax Regime   │  │ 3C: Currency     │
  │     Module       │  │     Module       │  │     Module       │
  └────────┬─────────┘  └────────┬─────────┘  └─────────────────┘
           │                     │
Phase 4 ──┴─────────────────────┴─────────────────────────────── PARALLEL ✦
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ 4A: Salary       │  │ 4B: Tax Slab     │  │ 4C: Statutory    │
  │     Component    │  │  + Surcharge     │  │   Contribution   │
  │     Module       │  │  + Cess Modules  │  │     Module       │
  └─────────────────┘  └─────────────────┘  └─────────────────┘
  ┌─────────────────┐
  │ 4D: Deduction    │
  │     Section      │
  │     Module       │
  └─────────────────┘

Phase 5 ──────────────────────────────────────────────────────── Sequential
  (Calculation Engine — depends on all CRUD modules)

Phase 6 ──────────────────────────────────────────────────────── Sequential
  (India seed data + migrations finalization)

Phase 7 ──────────────────────────────────────────────────────── Sequential
  (Integration testing + validation)
```

---

## Phase 1: Project Foundation (Sequential)

> **Goal**: Scaffolded NestJS project with strict TypeScript, PostgreSQL connection, and base configuration.

### Action Items

- [ ] **1.1** Scaffold NestJS project using `npx -y @nestjs/cli new ./ --strict --skip-git --package-manager npm`
- [ ] **1.2** Configure `tsconfig.json` with strict mode flags:
  ```
  strict: true, strictNullChecks: true, strictPropertyInitialization: true,
  noImplicitAny: true, noUnusedLocals: true, noUnusedParameters: true,
  esModuleInterop: true, forceConsistentCasingInFileNames: true
  ```
- [ ] **1.3** Install dependencies:
  ```
  Core: @nestjs/config, @nestjs/typeorm, typeorm, pg
  Validation: class-validator, class-transformer
  Utility: uuid
  Dev: @types/node, @types/uuid
  ```
- [ ] **1.4** Create `src/config/app.config.ts` — environment-based config using `@nestjs/config`:
  ```typescript
  // registerAs('app') → port, nodeEnv, apiPrefix ('api/v1')
  ```
- [ ] **1.5** Create `src/config/database.config.ts` — TypeORM config:
  ```typescript
  // registerAs('database') → host, port, username, password, database, synchronize (false), logging
  ```
- [ ] **1.6** Create `src/config/validation.schema.ts` — Joi schema for env validation:
  ```typescript
  // DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, NODE_ENV, PORT
  ```
- [ ] **1.7** Create `src/database/database.module.ts` — TypeORM module using `forRootAsync` with `ConfigService`
- [ ] **1.8** Update `src/app.module.ts`:
  - Import `ConfigModule.forRoot({ isGlobal: true, validationSchema })`
  - Import `DatabaseModule`
  - Set global prefix `api/v1` in `main.ts`
  - Enable CORS, validation pipe (global), shutdown hooks
- [ ] **1.9** Create `.env.example` with all required environment variables
- [ ] **1.10** Create `src/main.ts` — bootstrap with global prefix, validation pipe, CORS, logger

### Verification Gate
```bash
npm run build   # TypeScript compiles cleanly
npm run start:dev   # App starts, connects to PG (or fails gracefully)
```

---

## Phase 2: Common Layer (Sequential)

> **Goal**: Shared enums, DTOs, constants, filters, interceptors used by all modules. Must complete before Phase 3.

### Action Items

- [ ] **2.1** Create enums in `src/common/enums/`:

  | File | Values |
  |------|--------|
  | `component-type.enum.ts` | `EARNING`, `DEDUCTION`, `EMPLOYER_CONTRIBUTION` |
  | `calculation-type.enum.ts` | `PERCENTAGE`, `FIXED`, `BALANCING` |
  | `contribution-side.enum.ts` | `EMPLOYEE`, `EMPLOYER` |
  | `condition-operator.enum.ts` | `EQ`, `LT`, `LTE`, `GT`, `GTE` |
  | `index.ts` | Barrel export |

- [ ] **2.2** Create `src/common/constants/exchange-rates.constant.ts`:
  ```typescript
  export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
    USD: { INR: 83.50, GBP: 0.79, EUR: 0.92, JPY: 149.50 },
    INR: { USD: 0.012, GBP: 0.0095, EUR: 0.011, JPY: 1.79 },
    GBP: { USD: 1.27, INR: 105.26, EUR: 1.17, JPY: 189.24 },
    EUR: { USD: 1.09, INR: 90.72, GBP: 0.86, JPY: 162.50 },
  };
  export const BASE_CURRENCY = 'USD';
  ```

- [ ] **2.3** Create `src/common/constants/error-codes.constant.ts`:
  ```typescript
  export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    COUNTRY_NOT_FOUND = 'COUNTRY_NOT_FOUND',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    INVALID_TAX_REGIME = 'INVALID_TAX_REGIME',
    INVALID_CTC = 'INVALID_CTC',
    NO_ACTIVE_RULES = 'NO_ACTIVE_RULES',
    UNSUPPORTED_CURRENCY = 'UNSUPPORTED_CURRENCY',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
  }
  ```

- [ ] **2.4** Create `src/common/dto/api-response.dto.ts`:
  ```typescript
  // ApiResponse<T> { success: boolean; data?: T; error?: ErrorDetail; timestamp: string; }
  // ErrorDetail { code: string; message: string; details: FieldError[]; }
  // FieldError { field: string; message: string; }
  ```

- [ ] **2.5** Create `src/common/dto/pagination.dto.ts`:
  ```typescript
  // PaginationQueryDto { page: number; limit: number; }
  // PaginatedResponse<T> extends ApiResponse<T[]> { meta: { page, limit, total, totalPages } }
  ```

- [ ] **2.6** Create `src/common/filters/http-exception.filter.ts`:
  - Catch all `HttpException` + unhandled errors
  - Return standardized `ApiResponse` with error code mapping
  - Handle `class-validator` `ValidationError[]` → field-level details

- [ ] **2.7** Create `src/common/interceptors/response-transform.interceptor.ts`:
  - Wrap all successful responses in `ApiResponse<T>` envelope
  - Add `timestamp` field

- [ ] **2.8** Create `src/common/interfaces/base-entity.interface.ts`:
  - Abstract base entity with `id` (UUID), `createdAt`, `updatedAt` columns
  - Use `@PrimaryGeneratedColumn('uuid')`, `@CreateDateColumn()`, `@UpdateDateColumn()`

- [ ] **2.9** Create `src/common/interfaces/effective-dated.interface.ts`:
  - Interface + mixin for `effectiveFrom`, `effectiveTo`, `isActive` columns
  - Reusable query helper: `buildEffectiveDateFilter(qb, date)`

- [ ] **2.10** Register global filter and interceptor in `app.module.ts` using `APP_FILTER` and `APP_INTERCEPTOR` providers

- [ ] **2.11** Create `src/common/index.ts` — barrel export for all common exports

### Verification Gate
```bash
npm run build   # All common types compile
```

---

## Phase 3: Core Entity Modules — PARALLEL ✦

> **Goal**: Country, Tax Regime, and Currency modules. These are base entities that other modules depend on.
>
> **Parallelism**: 3A, 3B, and 3C can be built simultaneously.

### 3A: Country Module

- [ ] **3A.1** Create `src/modules/country/entities/country.entity.ts`:
  - Columns: `id` (UUID PK), `code` (VARCHAR(2), unique), `name`, `currencyCode`, `currencySymbol`, `fiscalYearStartMonth` (smallint, CHECK 1–12), `isActive`, `createdAt`, `updatedAt`
  - Relations: `OneToMany → taxRegimes`, `salaryComponents`, `statutoryContributions`, `deductionSections`
  - Index: `UNIQUE(code)`

- [ ] **3A.2** Create DTOs in `src/modules/country/dto/`:
  - `create-country.dto.ts` — `@IsString()`, `@Length(2,2)`, `@IsUppercase()` for code; `@IsInt()`, `@Min(1)`, `@Max(12)` for month
  - `update-country.dto.ts` — `PartialType(OmitType(CreateCountryDto, ['code']))` (code immutable)
  - `country-response.dto.ts` — response shape

- [ ] **3A.3** Create `src/modules/country/country.service.ts`:
  - `create()` — check duplicate code → `409 DUPLICATE_ENTRY`
  - `findAll(pagination, isActive)` — paginated query
  - `findByCode(code)` — `404 COUNTRY_NOT_FOUND` if missing
  - `update(code, dto)` — partial update
  - `softDelete(code)` — set `isActive = false`

- [ ] **3A.4** Create `src/modules/country/country.controller.ts`:
  - `POST /countries`, `GET /countries`, `GET /countries/:code`, `PATCH /countries/:code`, `DELETE /countries/:code`

- [ ] **3A.5** Create `src/modules/country/country.module.ts`:
  - Register entity, service, controller
  - Export `CountryService` (needed by other modules)

### 3B: Tax Regime Module

- [ ] **3B.1** Create `src/modules/tax-regime/entities/tax-regime.entity.ts`:
  - Columns per schema doc (2.2). `ManyToOne → Country`. `OneToMany → taxSlabs, taxSurcharges, taxCessRules, deductionSections`
  - Composite unique: `(countryId, code, effectiveFrom)`

- [ ] **3B.2** Create DTOs — `create-tax-regime.dto.ts`, `update-tax-regime.dto.ts`
  - Validate `effectiveFrom` as ISO date, `isDefault` boolean

- [ ] **3B.3** Create `tax-regime.service.ts`:
  - CRUD with effective date filtering
  - Validate `countryCode` exists via `CountryService`
  - Duplicate check on `(countryId, code, effectiveFrom)`

- [ ] **3B.4** Create `tax-regime.controller.ts`:
  - Nested under `/countries/:countryCode/tax-regimes`
  - Use `@Param('countryCode')` to resolve country

- [ ] **3B.5** Create `tax-regime.module.ts`:
  - Import `CountryModule`
  - Export `TaxRegimeService`

### 3C: Currency Module

- [ ] **3C.1** Create `src/common/interfaces/exchange-rate-provider.interface.ts`:
  ```typescript
  export interface ExchangeRateProvider {
    getRate(from: string, to: string, date?: Date): Promise<number>;
    getSupportedCurrencies(): string[];
  }
  ```

- [ ] **3C.2** Create `src/modules/currency/currency.service.ts`:
  - Implement `ExchangeRateProvider` using static `EXCHANGE_RATES` constant
  - `convert(amount, from, to)` → returns converted amount
  - `validateCurrency(code)` → throws `UNSUPPORTED_CURRENCY` if not in map
  - `getSupportedCurrencies()` → returns all keys

- [ ] **3C.3** Create `src/modules/currency/currency.module.ts`:
  - Register `CurrencyService` with provider token `EXCHANGE_RATE_PROVIDER`
  - Export service (global)

### Verification Gate (All of Phase 3)
```bash
npm run build
# Manual test: POST /api/v1/countries with India payload → 201
# Manual test: POST /api/v1/countries/:code/tax-regimes → 201
```

---

## Phase 4: Configuration Modules — PARALLEL ✦

> **Goal**: All remaining CRUD modules for rule configuration.
>
> **Parallelism**: 4A, 4B, 4C, 4D can be built simultaneously. All depend on Phase 3 (Country + Tax Regime).

### 4A: Salary Component Module (+ Component Conditions)

- [ ] **4A.1** Create entities:
  - `salary-component.entity.ts` — all columns per schema doc (2.3). `ManyToOne → Country`. `OneToMany → componentConditions`.
    - Use PG enum types for `componentType` and `calculationType`
  - `component-condition.entity.ts` — all columns per schema doc (2.4). `ManyToOne → SalaryComponent`.

- [ ] **4A.2** Create DTOs:
  - `create-salary-component.dto.ts` — includes nested `conditions: CreateComponentConditionDto[]` (optional array)
  - `update-salary-component.dto.ts` — `PartialType`
  - `create-component-condition.dto.ts` — condition fields with `@IsEnum(ConditionOperator)`
  - Validate: `calculationBase` required when `calculationType = PERCENTAGE`; `defaultValue` nullable when `calculationType = BALANCING`

- [ ] **4A.3** Create `salary-component.service.ts`:
  - CRUD with cascade create for `conditions` (TypeORM cascade)
  - Effective date filtering
  - `findActiveByCountry(countryId, effectiveDate)` — used by calculation engine
  - Duplicate check on `(countryId, code, effectiveFrom)`

- [ ] **4A.4** Create `salary-component.controller.ts`:
  - Nested: `/countries/:countryCode/salary-components`
  - Query params: `effective_date`, `component_type`, `is_active`

- [ ] **4A.5** Create `salary-component.module.ts`:
  - Import `CountryModule`
  - Export `SalaryComponentService`

### 4B: Tax Slab + Tax Surcharge + Tax Cess Modules

> Three closely related entities, all under `tax-regime`. Bundled as single module with multiple entities.

- [ ] **4B.1** Create entities:
  - `tax-slab.entity.ts` — per schema doc (2.5). `ManyToOne → TaxRegime`. `maxAmount` nullable for top slab.
  - `tax-surcharge.entity.ts` — per schema doc (2.6). `ManyToOne → TaxRegime`. `maxIncome` nullable.
  - `tax-cess.entity.ts` — per schema doc (2.7). `ManyToOne → TaxRegime`.

- [ ] **4B.2** Create DTOs for each entity:
  - `create-tax-slab.dto.ts` — validate `minAmount < maxAmount` (custom validator), `ratePercentage` 0–100
  - `create-tax-surcharge.dto.ts` — validate `minIncome < maxIncome`
  - `create-tax-cess.dto.ts` — `appliesOn` as string (`TAX_PLUS_SURCHARGE`)

- [ ] **4B.3** Create `tax-slab.service.ts`:
  - CRUD + `findActiveByRegime(regimeId, effectiveDate)` — ordered by `displayOrder`
  - Validate regime exists via `TaxRegimeService`

- [ ] **4B.4** Create `tax-surcharge.service.ts`:
  - CRUD + `findActiveByRegime(regimeId, effectiveDate)` — ordered by `minIncome`

- [ ] **4B.5** Create `tax-cess.service.ts`:
  - CRUD + `findActiveByRegime(regimeId, effectiveDate)`

- [ ] **4B.6** Create controllers:
  - `tax-slab.controller.ts` → `/countries/:countryCode/tax-regimes/:regimeId/tax-slabs`
  - `tax-surcharge.controller.ts` → `/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges`
  - `tax-cess.controller.ts` → `/countries/:countryCode/tax-regimes/:regimeId/tax-cess`

- [ ] **4B.7** Create `tax-slab.module.ts`:
  - Import `CountryModule`, `TaxRegimeModule`
  - Register all 3 entities, 3 services, 3 controllers
  - Export all 3 services

### 4C: Statutory Contribution Module

- [ ] **4C.1** Create `statutory-contribution.entity.ts` — per schema doc (2.8). `ManyToOne → Country`.
  - PG enum for `contributionSide`, `calculationType`
  - Composite unique: `(countryId, code, effectiveFrom)`

- [ ] **4C.2** Create DTOs:
  - `create-statutory-contribution.dto.ts` — validate `ratePercentage` when `calculationType = PERCENTAGE`
  - `update-statutory-contribution.dto.ts` — `PartialType`

- [ ] **4C.3** Create `statutory-contribution.service.ts`:
  - CRUD + `findActiveByCountry(countryId, effectiveDate)` — used by calculation engine
  - Filter by `contributionSide` query param

- [ ] **4C.4** Create controller → `/countries/:countryCode/statutory-contributions`

- [ ] **4C.5** Create `statutory-contribution.module.ts`:
  - Import `CountryModule`
  - Export `StatutoryContributionService`

### 4D: Deduction Section Module

- [ ] **4D.1** Create `deduction-section.entity.ts` — per schema doc (2.9). `ManyToOne → Country`, `ManyToOne → TaxRegime` (nullable).
  - Composite unique: `(countryId, code, effectiveFrom)`

- [ ] **4D.2** Create DTOs:
  - `create-deduction-section.dto.ts` — validate `regimeId` present when `isApplicableAllRegimes = false`
  - `update-deduction-section.dto.ts` — `PartialType`

- [ ] **4D.3** Create `deduction-section.service.ts`:
  - CRUD + `findActiveByCountryAndRegime(countryId, regimeId, effectiveDate)`:
    - Returns sections where `regimeId = :regimeId OR isApplicableAllRegimes = true`

- [ ] **4D.4** Create controller → `/countries/:countryCode/deduction-sections`

- [ ] **4D.5** Create `deduction-section.module.ts`:
  - Import `CountryModule`, `TaxRegimeModule`
  - Export `DeductionSectionService`

### Verification Gate (All of Phase 4)
```bash
npm run build
# Manual: Create salary components, tax slabs, statutory contributions, deduction sections for India
# Verify: GET endpoints return correct paginated/filtered data
```

---

## Phase 5: Calculation Engine (Sequential)

> **Goal**: Core stateless calculation engine. Depends on all CRUD modules (Phases 3–4) for rule loading.

### Action Items

- [ ] **5.1** Create `src/modules/calculation/dto/calculate-payroll.dto.ts`:
  ```typescript
  // Fields: countryCode, annualCtc, taxRegimeCode, isMetro?, employeeAge?,
  //         claimedDeductions?: Record<string, number>, effectiveDate?, outputCurrency?
  // Validators: @IsString(), @IsPositive(), @IsOptional(), @IsISO8601(), etc.
  ```

- [ ] **5.2** Create `src/modules/calculation/dto/payroll-breakdown.dto.ts`:
  - Type-safe response interfaces:
    ```typescript
    interface PayrollBreakdown {
      country: CountryInfo;
      input: CalculationInput;
      salaryBreakdown: AnnualMonthly<SalaryComponents>;
      employerContributions: AnnualMonthly<ContributionComponents>;
      employeeDeductions: AnnualMonthly<DeductionComponents>;
      taxCalculation: TaxCalculationDetail;
      netSalary: AnnualMonthly<{ total: number }>;
      totalEmployerCost: AnnualMonthly<{ total: number }>;
      currency: CurrencyInfo;
    }
    // Generic: AnnualMonthly<T> = { annual: T; monthly: T; }
    ```

- [ ] **5.3** Create `src/modules/calculation/services/salary-calculator.service.ts`:
  - `calculateComponents(annualCtc, components, conditions, context)` → `SalaryBreakdown`
  - **Algorithm**:
    1. Sort components by `displayOrder`
    2. Build a resolved-values map: `{ CTC: annualCtc }`
    3. For each component:
       - If `PERCENTAGE`: resolve `calculationBase` from map, apply `defaultValue`%, respect `wageCeiling` and `min/maxValue`
       - If `FIXED`: use `defaultValue` directly
       - If `BALANCING`: defer to end — compute as `resolvedValues[calculationBase] - sum(other EARNING components)`
       - Check `componentConditions` — if condition matches context (metro, age, thresholds), use `overrideValue`
    4. Calculate `grossSalary` = sum of all `EARNING` components
    5. Store each resolved value in the map for downstream components

- [ ] **5.4** Create `src/modules/calculation/services/statutory-calculator.service.ts`:
  - `calculateContributions(salaryBreakdown, contributions, context)` → `{ employee: {...}, employer: {...} }`
  - **Algorithm**:
    1. For each statutory contribution:
       - Resolve `calculationBase` from salary breakdown (e.g., `BASIC` → monthly basic)
       - If `wageCeiling`: cap the base at ceiling for calculation
       - If `thresholdMax`: skip if monthly base exceeds threshold (e.g., ESI)
       - If `PERCENTAGE`: `base * rate / 100`
       - If `FIXED`: use fixed amount
       - Respect `maxContribution` cap
    2. Separate into `EMPLOYEE` and `EMPLOYER` buckets
    3. Return both annual (×12) and monthly amounts

- [ ] **5.5** Create `src/modules/calculation/services/tax-calculator.service.ts`:
  - `calculateTax(grossIncome, deductions, slabs, surcharges, cessRules, claimedDeductions, regime)` → `TaxCalculationDetail`
  - **Algorithm**:
    1. Start with `grossTaxableIncome` = annual gross salary
    2. Apply `STANDARD_DEDUCTION` (applicable to all regimes or regime-specific)
    3. For each `claimedDeduction`:
       - Find matching `deductionSection` by code
       - Verify section applies to selected regime (`isApplicableAllRegimes` or `regimeId` matches)
       - Cap at section's `maxLimit`
    4. Calculate `netTaxableIncome` = gross - total deductions
    5. Apply progressive tax slabs:
       ```
       for each slab (ordered by displayOrder):
         taxableInSlab = min(income, maxAmount) - minAmount
         if taxableInSlab > 0: tax += taxableInSlab * rate / 100
       ```
    6. Apply surcharge: find matching income bracket, `baseTax * surchargeRate / 100`
    7. Apply cess: `(baseTax + surcharge) * cessRate / 100`
    8. Total tax = baseTax + surcharge + cess
    9. Return slab-wise breakdown

- [ ] **5.6** Create `src/modules/calculation/services/currency-converter.service.ts`:
  - Inject `CurrencyService`
  - `convertBreakdown(breakdown, fromCurrency, toCurrency)` → converted amounts
  - Returns `null` if `outputCurrency` not provided or same as primary

- [ ] **5.7** Create `src/modules/calculation/services/calculation-orchestrator.service.ts`:
  - **Main orchestration flow**:
    1. Validate input → `CalculatePayrollDto`
    2. Load country by code → `COUNTRY_NOT_FOUND`
    3. Load tax regime by country + code + effectiveDate → `INVALID_TAX_REGIME`
    4. Load all active rules in parallel:
       ```typescript
       const [components, contributions, slabs, surcharges, cessRules, deductions] =
         await Promise.all([
           salaryComponentService.findActiveByCountry(countryId, effectiveDate),
           statutoryContributionService.findActiveByCountry(countryId, effectiveDate),
           taxSlabService.findActiveByRegime(regimeId, effectiveDate),
           taxSurchargeService.findActiveByRegime(regimeId, effectiveDate),
           taxCessService.findActiveByRegime(regimeId, effectiveDate),
           deductionSectionService.findActiveByCountryAndRegime(countryId, regimeId, effectiveDate),
         ]);
       ```
    5. Validate rules exist → `NO_ACTIVE_RULES` if empty
    6. Call `SalaryCalculatorService.calculateComponents()`
    7. Call `StatutoryCalculatorService.calculateContributions()`
    8. Call `TaxCalculatorService.calculateTax()`
    9. Compute `netSalary` = gross - employee deductions total
    10. Compute `totalEmployerCost` = CTC
    11. If `outputCurrency`: call `CurrencyConverterService.convertBreakdown()`
    12. Assemble and return `PayrollBreakdown`

- [ ] **5.8** Create `src/modules/calculation/calculation.controller.ts`:
  - `POST /calculate/payroll` → `CalculationOrchestratorService.calculatePayroll(dto)`

- [ ] **5.9** Create `src/modules/calculation/calculation.module.ts`:
  - Import all CRUD modules + `CurrencyModule`
  - Register orchestrator + 4 sub-calculator services
  - No exports (this is an endpoint-only module)

### Verification Gate
```bash
npm run build
# After seeds (Phase 6): POST /api/v1/calculate/payroll with India CTC → verify breakdown
```

---

## Phase 6: Database Migrations & Seed Data (Sequential)

> **Goal**: TypeORM migrations for all 9 tables + India FY 2025–26 seed data.

### Action Items

- [ ] **6.1** Configure TypeORM CLI in `package.json`:
  ```json
  "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
  "migration:generate": "npm run typeorm -- migration:generate -d src/config/typeorm.config.ts",
  "migration:run": "npm run typeorm -- migration:run -d src/config/typeorm.config.ts",
  "migration:revert": "npm run typeorm -- migration:revert -d src/config/typeorm.config.ts",
  "seed:run": "ts-node -r tsconfig-paths/register src/database/seeds/seed.ts"
  ```

- [ ] **6.2** Create `src/config/typeorm.config.ts` — DataSource export for CLI

- [ ] **6.3** Generate migration: `npm run migration:generate -- src/database/migrations/InitialSchema`
  - Verify all 9 tables, indexes, constraints, enums created

- [ ] **6.4** Create seed runner — `src/database/seeds/seed.module.ts` + `seed.service.ts` + `seed.ts` (CLI entry):
  - Idempotent: check existence before insert (upsert by unique key)
  - Transactional: all seeds within single transaction

- [ ] **6.5** Create `src/database/seeds/data/india/country.seed.ts`:
  ```typescript
  { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: '₹', fiscalYearStartMonth: 4 }
  ```

- [ ] **6.6** Create `src/database/seeds/data/india/tax-regimes.seed.ts`:
  ```typescript
  [
    { code: 'OLD_REGIME', name: 'Old Tax Regime', isDefault: false, effectiveFrom: '2025-04-01' },
    { code: 'NEW_REGIME', name: 'New Tax Regime', isDefault: true, effectiveFrom: '2025-04-01' },
  ]
  ```

- [ ] **6.7** Create `src/database/seeds/data/india/salary-components.seed.ts`:
  - Basic (40% of CTC, order: 1)
  - HRA (50%/40% of BASIC, order: 2, conditions: METRO/NON_METRO)
  - Special Allowance (BALANCING, order: 10)
  - Employer EPF (12% of BASIC, EMPLOYER_CONTRIBUTION, wage_ceiling: 15000, order: 3)
  - Employer ESI (3.25% of GROSS, EMPLOYER_CONTRIBUTION, threshold: 21000, order: 4)
  - Gratuity (4.81% of BASIC, EMPLOYER_CONTRIBUTION, order: 5)

- [ ] **6.8** Create `src/database/seeds/data/india/tax-slabs.seed.ts`:
  - Old Regime slabs (FY 2025–26): 0–2.5L (0%), 2.5L–5L (5%), 5L–10L (20%), 10L+ (30%)
  - New Regime slabs (FY 2025–26): 0–4L (0%), 4L–8L (5%), 8L–12L (10%), 12L–16L (15%), 16L–20L (20%), 20L–24L (25%), 24L+ (30%)
  - Surcharges for both regimes
  - Cess: Health & Education Cess (4%) for both regimes

- [ ] **6.9** Create `src/database/seeds/data/india/statutory-contributions.seed.ts`:
  - EPF Employee (12%, BASIC, ceiling 15000)
  - EPF Employer (12%, BASIC, ceiling 15000)
  - ESI Employee (0.75%, GROSS, threshold 21000)
  - ESI Employer (3.25%, GROSS, threshold 21000)
  - PT Employee (FIXED, ₹200/month = ₹2400/year)
  - Gratuity Employer (4.81%, BASIC)

- [ ] **6.10** Create `src/database/seeds/data/india/deduction-sections.seed.ts`:
  - Standard Deduction (₹50,000 Old, ₹75,000 New — applicable to all regimes, but different limits per regime)
  - Section 80C (₹1,50,000 — Old regime only)
  - Section 80D (₹25,000 — Old regime only)
  - Section 80CCD(1B) (₹50,000 — Old regime only)

### Verification Gate
```bash
npm run migration:run     # Tables created
npm run seed:run          # India data seeded
# Query: SELECT * FROM countries → 1 row (India)
# Query: SELECT * FROM tax_slabs → 11+ rows (Old + New regime slabs)
```

---

## Phase 7: Health Check + Integration Validation (Sequential)

> **Goal**: Health endpoint, final wiring, end-to-end validation.

### Action Items

- [ ] **7.1** Create health check endpoint:
  - `GET /health` → `{ status: 'ok', database: 'connected', uptime, timestamp }`
  - Use TypeORM `DataSource.isInitialized` for DB check

- [ ] **7.2** Register all modules in `app.module.ts` in correct order:
  ```typescript
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    DatabaseModule,
    CountryModule,
    TaxRegimeModule,
    SalaryComponentModule,
    TaxSlabModule,
    StatutoryContributionModule,
    DeductionSectionModule,
    CurrencyModule,
    CalculationModule,
  ]
  ```

- [ ] **7.3** Run full integration validation:

  | Test | Endpoint | Expected |
  |------|----------|----------|
  | Health | `GET /health` | `200 { status: 'ok' }` |
  | List countries | `GET /api/v1/countries` | `200 [India]` |
  | Get India | `GET /api/v1/countries/IN` | `200 { code: 'IN', ... }` |
  | List regimes | `GET /api/v1/countries/IN/tax-regimes` | `200 [Old, New]` |
  | List components | `GET /api/v1/countries/IN/salary-components` | `200 [Basic, HRA, ...]` |
  | List slabs | `GET /api/v1/countries/IN/tax-regimes/:id/tax-slabs` | `200 [7 slabs]` |
  | **Calculate (New Regime)** | `POST /api/v1/calculate/payroll` | `200 — full breakdown` |
  | **Calculate (Old Regime)** | `POST /api/v1/calculate/payroll` | `200 — with 80C deduction` |
  | Invalid country | `POST /api/v1/calculate/payroll { country_code: 'XX' }` | `404 COUNTRY_NOT_FOUND` |
  | Invalid CTC | `POST /api/v1/calculate/payroll { annual_ctc: -1 }` | `400 VALIDATION_ERROR` |
  | Currency conversion | `POST /api/v1/calculate/payroll { output_currency: 'USD' }` | `200 — with converted section` |

- [ ] **7.4** Verify calculation accuracy:
  - CTC = ₹12,00,000, New Regime, Metro:
    - Basic = ₹4,80,000 (40% of CTC)
    - HRA = ₹2,40,000 (50% of Basic, metro)
    - Employer EPF = ₹21,600 (12% of ₹15,000 × 12 months)
    - Gratuity = ₹23,088 (4.81% of Basic)
    - Gross = CTC - Employer EPF - Employer ESI - Gratuity
    - Standard Deduction = ₹75,000 (New Regime)
    - Tax computed on slabs → verify base tax + cess
    - Net = Gross - Employee EPF - PT - Tax

- [ ] **7.5** Verify edge cases:
  - CTC below ESI threshold (Gross ≤ ₹21,000/month) → ESI applied
  - CTC above ESI threshold → ESI = 0
  - Old Regime with max 80C deduction → deduction capped at ₹1,50,000
  - New Regime ignores 80C/80D claimed deductions
  - High income → surcharge applied

---

## Summary: Task Count by Phase

| Phase | Tasks | Parallel? | Depends On |
|-------|-------|-----------|------------|
| **Phase 1**: Project Foundation | 10 | Sequential | — |
| **Phase 2**: Common Layer | 11 | Sequential | Phase 1 |
| **Phase 3**: Core Entities | 13 (3A:5 + 3B:5 + 3C:3) | ✅ **Parallel** | Phase 2 |
| **Phase 4**: Config Modules | 17 (4A:5 + 4B:7 + 4C:5 + 4D:5) | ✅ **Parallel** | Phase 3 |
| **Phase 5**: Calculation Engine | 9 | Sequential | Phase 3 + 4 |
| **Phase 6**: Migrations & Seeds | 10 | Sequential | Phase 5 |
| **Phase 7**: Integration | 5 | Sequential | Phase 6 |
| **Total** | **75 tasks** | | |

---

## Open Questions

None — all decisions resolved in architecture and brainstorming phases.
