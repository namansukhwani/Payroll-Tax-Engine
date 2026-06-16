# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npm run start:dev          # start with file-watch
npm run build              # compile TypeScript

# Database
npm run migration:run      # apply pending migrations (requires .env)
npm run migration:generate -- src/database/migrations/<Name>  # generate from entity diff
npm run migration:revert   # roll back last migration
npm run seed:run           # seed India reference data (run after migration:run)

# Tests
npm run test               # unit tests (Jest)
npm run test:watch         # watch mode
npm run test -- --testPathPattern=calculation.spec  # run single spec file

# Quality
npm run lint               # ESLint with auto-fix

# API integration tests (requires running server)
./test-api.sh              # full API flow test; accepts optional BASE_URL arg
```

## Environment

Create `.env` at project root:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=taxcalculator
PORT=3000          # optional, defaults to 3000
```

`synchronize` is `false`; always use migrations for schema changes.

## Architecture

### Module Graph

`AppModule` imports only `DatabaseModule` and `CalculationModule`. All feature modules (Country, TaxRegime, SalaryComponent, StatutoryContribution, TaxSlab, DeductionSection, Currency) are imported inside `CalculationModule` — they are not registered at the app root. When adding a new domain module, import it in `CalculationModule`, not `AppModule`.

### Domain Modules (`src/modules/`)

Each module follows the pattern: `entity → service → controller → module`. Modules that own sub-resources (tax-slabs owns surcharges and cess) keep all three entities and services inside the same module folder.

| Module | Key entities |
|---|---|
| `country` | `Country` |
| `tax-regime` | `TaxRegime` |
| `tax-slab` | `TaxSlab`, `TaxSurcharge`, `TaxCess` |
| `salary-component` | `SalaryComponent`, `ComponentCondition` |
| `statutory-contribution` | `StatutoryContribution` |
| `deduction-section` | `DeductionSection` |
| `currency` | stateless service, no DB |
| `calculation` | orchestrator + 4 calculator services, no DB |

### Calculation Pipeline (`src/modules/calculation/`)

`CalculationOrchestratorService` coordinates the stateless payroll calculation in a fixed order:

1. Load country + tax regime from DB
2. Load all active rules in parallel (salary components, contributions, slabs, surcharges, cess, deductions) — filtered by `effective_date`
3. **`SalaryCalculatorService`** — 3-pass algorithm:
   - Pass 1: non-BALANCING EARNING/DEDUCTION components (sorted by `displayOrder`)
   - Pass 2: BALANCING components (fills remainder of GROSS)
   - Pass 3: EMPLOYER_CONTRIBUTION components (needs GROSS resolved first)
4. **`StatutoryCalculatorService`** — applies wage ceilings, `thresholdMin/Max` eligibility checks
5. **`TaxCalculatorService`** — progressive slabs → surcharge → cess. `STANDARD_DEDUCTION` is auto-applied by matching the code string `'STANDARD_DEDUCTION'`, not a flag.
6. **`CurrencyConverterService`** — static exchange rate table only; supported currencies are `USD`, `INR`, `GBP`, `EUR` (hardcoded in `src/common/constants/exchange-rates.constant.ts`). Adding a new currency requires updating that constant.

### Global Infrastructure

- **Response envelope** — `ResponseTransformInterceptor` wraps every success response in `{ success: true, data: ..., timestamp }`. Controllers return plain objects; never wrap manually.
- **Error handling** — `HttpExceptionFilter` catches all exceptions and emits `{ success: false, error: { code, message, details } }`. Throw NestJS `HttpException` subclasses with an `ErrorCode` string as the `error` property. Available codes are in `src/common/constants/error-codes.constant.ts`.
- **Validation** — global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

### Effective-Date Versioning

All rule entities have `effective_from` / `effective_to` / `is_active`. Service `findActive*` methods filter by these fields against a supplied date. Soft deletes set `is_active = false` and never remove rows.

### Unit Tests

All pure calculation logic is covered in `src/modules/calculation/services/calculation.spec.ts`. This file tests `SalaryCalculatorService`, `StatutoryCalculatorService`, and `TaxCalculatorService` without any DB or NestJS bootstrap — tests instantiate services directly with hand-crafted entity objects. Follow this pattern when extending tests.

### Seeding

`npm run seed:run` loads India reference data (country, both tax regimes, salary components, statutory contributions, deduction sections, tax slabs for FY 2025-26). Seed data lives under `src/database/seeds/data/india/`.
