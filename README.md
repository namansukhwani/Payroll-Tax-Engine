# Payroll Tax Engine

> **Version**: 1.0.0 &nbsp;|&nbsp; **Stack**: NestJS · TypeORM · PostgreSQL · TypeScript (strict)

A stateless, modular payroll tax calculation engine that computes full salary breakdowns, statutory contributions, and income tax — supporting multi-country, multi-regime, and multi-currency payroll scenarios.

---

## Features

- **Full Payroll Breakdown** — Gross salary, net salary, employer cost (annual + monthly)
- **Multi-Country** — Country-scoped salary components, tax rules, and statutory contributions
- **Multi-Regime** — Old & New tax regimes (India FY 2025–26 seeded out of the box)
- **Progressive Tax Engine** — Slab-wise tax + surcharge + cess with effective-date filtering
- **Statutory Contributions** — EPF, ESI, PT, Gratuity (employee + employer split)
- **Deduction Sections** — 80C, 80D, 80CCD(1B), Standard Deduction (regime-aware caps)
- **Currency Conversion** — Static exchange rates with `ExchangeRateProvider` interface (USD, INR, GBP, EUR, JPY)
- **Effective Date Filtering** — All rules versioned by `effectiveFrom` / `effectiveTo`
- **Structured API Responses** — `ApiResponse<T>` envelope with field-level validation errors

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 (strict) |
| ORM | TypeORM 1.x |
| Database | PostgreSQL |
| Validation | class-validator · class-transformer |
| Config | @nestjs/config · Joi schema validation |
| Runtime | Node.js |

---

## Project Structure

```
src/
├── config/                    # App, database, TypeORM CLI config + Joi env schema
├── database/
│   ├── migrations/            # TypeORM migrations (auto-generated)
│   └── seeds/                 # India FY 2025–26 seed data
├── common/
│   ├── enums/                 # ComponentType, CalculationType, ContributionSide, ConditionOperator
│   ├── constants/             # Exchange rates, error codes
│   ├── dto/                   # ApiResponse<T>, PaginatedResponse<T>
│   ├── filters/               # Global HTTP exception filter
│   ├── interceptors/          # Response transform interceptor
│   └── interfaces/            # BaseEntity, EffectiveDated, ExchangeRateProvider
└── modules/
    ├── country/               # Country CRUD
    ├── tax-regime/            # Tax regime CRUD (nested under country)
    ├── salary-component/      # Salary components + conditions CRUD
    ├── tax-slab/              # Tax slabs, surcharges, cess CRUD
    ├── statutory-contribution/# Statutory contributions CRUD
    ├── deduction-section/     # Deduction sections CRUD
    ├── currency/              # Currency conversion service
    └── calculation/           # Payroll calculation orchestrator + sub-calculators
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=payroll_tax_engine
NODE_ENV=development
PORT=3000
```

### 3. Run database migrations

```bash
npm run migration:run
```

### 4. Seed India FY 2025–26 data

```bash
npm run seed:run
```

### 5. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

Server runs at `http://localhost:3000` with global prefix `/api/v1`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm run start:dev` | Dev server with hot-reload |
| `npm run start:prod` | Production server |
| `npm run lint` | ESLint + auto-fix |
| `npm run format` | Prettier format |
| `npm run test` | Unit tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | E2E tests |
| `npm run migration:generate` | Generate new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed:run` | Seed India FY 2025–26 data |

---

## API Overview

All endpoints are prefixed with `/api/v1`.

### Health

```
GET /health
```

### Countries

```
POST   /api/v1/countries
GET    /api/v1/countries
GET    /api/v1/countries/:code
PATCH  /api/v1/countries/:code
DELETE /api/v1/countries/:code
```

### Tax Regimes

```
POST   /api/v1/countries/:countryCode/tax-regimes
GET    /api/v1/countries/:countryCode/tax-regimes
GET    /api/v1/countries/:countryCode/tax-regimes/:id
PATCH  /api/v1/countries/:countryCode/tax-regimes/:id
DELETE /api/v1/countries/:countryCode/tax-regimes/:id
```

### Salary Components

```
POST   /api/v1/countries/:countryCode/salary-components
GET    /api/v1/countries/:countryCode/salary-components
PATCH  /api/v1/countries/:countryCode/salary-components/:id
DELETE /api/v1/countries/:countryCode/salary-components/:id
```

### Tax Slabs / Surcharges / Cess

```
POST   /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs
GET    /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs
POST   /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges
GET    /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges
POST   /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess
GET    /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess
```

### Statutory Contributions

```
POST   /api/v1/countries/:countryCode/statutory-contributions
GET    /api/v1/countries/:countryCode/statutory-contributions
PATCH  /api/v1/countries/:countryCode/statutory-contributions/:id
```

### Deduction Sections

```
POST   /api/v1/countries/:countryCode/deduction-sections
GET    /api/v1/countries/:countryCode/deduction-sections
PATCH  /api/v1/countries/:countryCode/deduction-sections/:id
```

### Payroll Calculation

```
POST /api/v1/calculate/payroll
```

**Request body:**

```json
{
  "countryCode": "IN",
  "annualCtc": 1200000,
  "taxRegimeCode": "NEW_REGIME",
  "isMetro": true,
  "employeeAge": 30,
  "claimedDeductions": {
    "80C": 150000,
    "80D": 25000
  },
  "effectiveDate": "2025-04-01",
  "outputCurrency": "USD"
}
```

**Response includes:**

- `salaryBreakdown` — Basic, HRA, Special Allowance (annual + monthly)
- `employerContributions` — EPF, ESI, Gratuity
- `employeeDeductions` — EPF, ESI, PT
- `taxCalculation` — Slab-wise breakdown, surcharge, cess, total tax
- `netSalary` — Annual + monthly
- `totalEmployerCost` — CTC reconciliation
- `currency` — Conversion details (if `outputCurrency` provided)

---

## Seeded India Data (FY 2025–26)

| Data | Details |
|---|---|
| Country | India (`IN`), INR, Fiscal year: April |
| Tax Regimes | Old Regime · New Regime (default) |
| Salary Components | Basic (40%), HRA (50%/40% metro), Special Allowance (balancing), Employer EPF, Employer ESI, Gratuity |
| Old Regime Tax Slabs | 0–2.5L (0%) · 2.5L–5L (5%) · 5L–10L (20%) · 10L+ (30%) |
| New Regime Tax Slabs | 0–4L (0%) · 4L–8L (5%) · 8L–12L (10%) · 12L–16L (15%) · 16L–20L (20%) · 20L–24L (25%) · 24L+ (30%) |
| Cess | Health & Education Cess 4% (both regimes) |
| Statutory | EPF (12%), ESI (Employee 0.75% / Employer 3.25%), PT (₹200/month), Gratuity (4.81%) |
| Deductions | Standard Deduction (₹50K Old / ₹75K New), 80C (₹1.5L), 80D (₹25K), 80CCD(1B) (₹50K) |

---

## Architecture

Clean Architecture layering — Domain → Application → Infrastructure. See full documentation:

| Document | Description |
|---|---|
| [01-architecture-design.md](documentation/01-architecture-design.md) | System architecture, module dependency graph |
| [02-requirements.md](documentation/02-requirements.md) | Functional & non-functional requirements |
| [03-database-schema.md](documentation/03-database-schema.md) | Entity schemas, indexes, constraints |
| [04-api-reference.md](documentation/04-api-reference.md) | Full API reference with request/response shapes |
| [05-implementation-plan.md](documentation/05-implementation-plan.md) | 7-phase implementation plan (75 tasks) |

---

## Implementation Phases

```
Phase 1 → Project scaffold + strict TypeScript + DB config
Phase 2 → Common layer (enums, DTOs, filters, interceptors)
Phase 3 → Country · Tax Regime · Currency modules  [PARALLEL]
Phase 4 → Salary Component · Tax Slab · Statutory · Deduction [PARALLEL]
Phase 5 → Calculation engine (orchestrator + 4 sub-calculators)
Phase 6 → Migrations + India seed data
Phase 7 → Health check + integration validation
```

---

## License

UNLICENSED — Private repository.
