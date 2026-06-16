# AGENTS.md

This file provides guidance to AI coding agents operating in this repository.

## Commands

Same as CLAUDE.md. Key ones:

```bash
npm run start:dev          # start server (port 3000)
npm run test               # Jest unit tests
npm run test -- --testPathPattern=calculation.spec  # single spec
npm run lint               # ESLint with auto-fix
npm run migration:run      # apply DB migrations
npm run seed:run           # seed India data
./test-api.sh              # integration tests (server must be running)
```

## Project Layout

```
src/
  app.module.ts                     # root — imports DatabaseModule + CalculationModule only
  config/                           # app/db config, validation schema, TypeORM datasource
  common/
    constants/                      # error codes, hardcoded exchange rates
    enums/                          # CalculationType, ComponentType, ContributionSide, ConditionOperator
    filters/http-exception.filter.ts
    interceptors/response-transform.interceptor.ts
  database/
    migrations/                     # TypeORM migrations (synchronize=false)
    seeds/data/india/               # India reference data seeds
  modules/
    country/
    tax-regime/
    tax-slab/                       # also owns TaxSurcharge, TaxCess entities
    salary-component/               # also owns ComponentCondition entity
    statutory-contribution/
    deduction-section/
    currency/                       # stateless, no DB
    calculation/
      services/
        calculation-orchestrator.service.ts   # coordinates full pipeline
        salary-calculator.service.ts          # 3-pass component resolution
        statutory-calculator.service.ts       # wage ceiling + threshold logic
        tax-calculator.service.ts             # progressive slabs + cess
        currency-converter.service.ts         # static rates table
      calculation.spec.ts                     # unit tests for all calc services
```

## Key Architecture Rules

**Module registration**: Feature modules are imported by `CalculationModule`, not `AppModule`. Don't add feature modules to `AppModule`.

**Response format**: `ResponseTransformInterceptor` auto-wraps success responses. Controllers return plain objects. `HttpExceptionFilter` handles all errors. Always throw NestJS `HttpException` subclasses with an `ErrorCode` string.

**Salary calculation order**: non-BALANCING earings first → BALANCING components (fills CTC remainder) → EMPLOYER_CONTRIBUTION components. This order is required because BALANCING and EMPLOYER_CONTRIBUTION depend on `GROSS` being set by the EARNING pass.

**STANDARD_DEDUCTION**: auto-applied by matching the string code `'STANDARD_DEDUCTION'` — no special flag on the entity.

**Currency**: only USD, INR, GBP, EUR supported. Rates live in `src/common/constants/exchange-rates.constant.ts` (static, not DB).

**Soft deletes**: all entities use `is_active = false`, never hard-delete rows.

**Effective dating**: all rule entities filter by `effective_from` / `effective_to`. Always supply or default `effective_date` when querying active rules.

## Testing Approach

Unit tests for calculation logic instantiate services directly — no NestJS testing module, no DB. Add new calculation tests to `src/modules/calculation/services/calculation.spec.ts` using the `makeComponent` / `makeSlab` / `makeContribution` / `makeDeductionSection` helpers already defined there.

For API-level testing run `./test-api.sh` against a live server.
