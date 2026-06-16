# Payroll Tax Engine — Functional & Non-Functional Requirements

> **Version**: 1.0.0  
> **Date**: 2026-06-16  

---

## 1. Functional Requirements

### FR-01: Country-Based Payroll Processing

| Field | Detail |
|-------|--------|
| **ID** | FR-01 |
| **Priority** | P0 — Must Have |
| **Description** | Accept employee payroll input with a country code and load applicable country-specific payroll rules from the database. |
| **Input** | `country_code` (ISO 3166-1 alpha-2), `annual_ctc`, `tax_regime_code` |
| **Behavior** | Engine loads all active rules (salary components, tax slabs, statutory contributions, deduction sections) for the specified country and effective date. |
| **Acceptance Criteria** | Given a valid country code and CTC, the engine loads the correct country configuration and proceeds with calculation. |

---

### FR-02: Input Validation

| Field | Detail |
|-------|--------|
| **ID** | FR-02 |
| **Priority** | P0 — Must Have |
| **Description** | Validate all inputs and return structured error responses for invalid, incomplete, duplicate, or unsupported requests. |
| **Validations** | |

| Input | Rule |
|-------|------|
| `country_code` | Required. Must exist in `countries` table. |
| `annual_ctc` | Required. Must be a positive number > 0. |
| `tax_regime_code` | Required. Must be a valid regime for the specified country. |
| `is_metro` | Optional. Boolean. Defaults to `false`. |
| `employee_age` | Optional. Positive integer. Defaults to `30`. |
| `claimed_deductions` | Optional. Object with section codes as keys, positive numbers as values. Invalid section codes rejected. |
| `effective_date` | Optional. ISO 8601 date string. Defaults to current date. |
| `output_currency` | Optional. ISO 4217 code. Must exist in exchange rates. |

| **Acceptance Criteria** | Invalid inputs return `400` with `VALIDATION_ERROR` code and field-level details. |

---

### FR-03: Configurable Rule Repository

| Field | Detail |
|-------|--------|
| **ID** | FR-03 |
| **Priority** | P0 — Must Have |
| **Description** | Store all country-specific tax slabs, deductions, exemptions, and contribution rules in the database — outside application logic. |
| **Entities** | Countries, Tax Regimes, Salary Components, Component Conditions, Tax Slabs, Tax Surcharges, Tax Cess Rules, Statutory Contributions, Deduction Sections |
| **Behavior** | CRUD admin endpoints allow managing all rule entities. All rules support effective dating (`effective_from`, `effective_to`). |
| **Acceptance Criteria** | Tax rules can be created, updated, and versioned via API without code changes or redeployment. |

---

### FR-04: Salary Component Calculation

| Field | Detail |
|-------|--------|
| **ID** | FR-04 |
| **Priority** | P0 — Must Have |
| **Description** | Derive salary components based on the configured structure for the selected country. |
| **Calculation Types** | |

| Type | Description | Example |
|------|-------------|---------|
| `PERCENTAGE` | Percentage of a base component | Basic = 40% of CTC |
| `FIXED` | Fixed amount | PT = ₹200/month |
| `BALANCING` | Remainder after all other components | Special Allowance = Gross - Basic - HRA |

| **Conditional Logic** | Components can have conditions (metro/non-metro, age thresholds, wage ceilings) that override default values. |
| **Acceptance Criteria** | Given CTC = ₹12,00,000, Basic = ₹4,80,000 (40%), HRA = ₹2,40,000 (50% of Basic, metro). Components resolve in dependency order. |

---

### FR-05: Employee Contribution Calculation

| Field | Detail |
|-------|--------|
| **ID** | FR-05 |
| **Priority** | P0 — Must Have |
| **Description** | Calculate mandatory employee-side deductions and statutory contributions. |
| **India Components** | |

| Component | Formula | Condition |
|-----------|---------|-----------|
| Employee EPF | 12% of Basic | Basic capped at ₹15,000/month for contribution calc |
| Employee ESI | 0.75% of Gross | Only if Gross ≤ ₹21,000/month |
| Professional Tax | Fixed per month (₹200) | Varies by state; simplified flat rate in MVP |

| **Acceptance Criteria** | Employee deductions computed correctly per active statutory rules. Wage ceilings and thresholds respected. |

---

### FR-06: Tax Calculation

| Field | Detail |
|-------|--------|
| **ID** | FR-06 |
| **Priority** | P0 — Must Have |
| **Description** | Compute employee income tax using configurable tax slabs and the selected tax regime. |
| **Flow** | |

```
Gross Annual Income
  └── Subtract: Standard Deduction
  └── Subtract: Claimed Deductions (regime-specific: 80C, 80D, etc.)
  = Net Taxable Income
  └── Apply: Progressive Tax Slabs
  = Base Tax
  └── Add: Surcharge (if applicable, income-based)
  = Tax + Surcharge
  └── Add: Cess (4% of Tax + Surcharge)
  = Total Annual Tax
  └── Divide by 12
  = Monthly TDS
```

| **Regime Support** | User selects `OLD_REGIME` or `NEW_REGIME`. Different slabs, deduction applicability. |
| **Acceptance Criteria** | Tax computed correctly for both regimes. Deductions only applied if the regime allows them. |

---

### FR-07: Employer Contribution Calculation

| Field | Detail |
|-------|--------|
| **ID** | FR-07 |
| **Priority** | P0 — Must Have |
| **Description** | Calculate employer-side statutory contributions and liabilities. |
| **India Components** | |

| Component | Formula | Condition |
|-----------|---------|-----------|
| Employer EPF | 12% of Basic | Basic capped at ₹15,000/month |
| Employer ESI | 3.25% of Gross | Only if Gross ≤ ₹21,000/month |
| Gratuity | 4.81% of Basic | Mandatory |

| **Acceptance Criteria** | Employer contributions computed per active rules. Thresholds and ceilings applied. |

---

### FR-08: Total Payroll Cost Calculation

| Field | Detail |
|-------|--------|
| **ID** | FR-08 |
| **Priority** | P0 — Must Have |
| **Description** | Determine the overall employer cost by combining salary and employer contributions. |
| **Formula** | `Total Employer Cost = CTC` (CTC already includes employer contributions by definition) |
| **Verification** | `CTC = Gross Salary + Employer EPF + Employer ESI + Gratuity` |
| **Acceptance Criteria** | Total employer cost matches input CTC. Component sum is verified internally. |

---

### FR-09: Detailed Payroll Breakdown Generation

| Field | Detail |
|-------|--------|
| **ID** | FR-09 |
| **Priority** | P0 — Must Have |
| **Description** | Return a structured breakdown of salary, deductions, taxes, contributions, net salary, and total payroll cost — both annual and monthly. |
| **Response Sections** | |

| Section | Contents |
|---------|----------|
| `salary_breakdown` | All salary components (annual + monthly) |
| `employee_deductions` | EPF, ESI, PT, Income Tax (annual + monthly) |
| `employer_contributions` | Employer EPF, ESI, Gratuity (annual + monthly) |
| `tax_calculation` | Gross income, deductions, taxable income, slab-wise tax, surcharge, cess |
| `net_salary` | Annual and monthly net take-home |
| `total_employer_cost` | Annual and monthly CTC |
| `currency` | Primary and converted (if requested) |

| **Acceptance Criteria** | Response contains all sections with accurate annual and monthly figures. Monthly = Annual / 12. |

---

### FR-10: Rule Versioning Support

| Field | Detail |
|-------|--------|
| **ID** | FR-10 |
| **Priority** | P0 — Must Have |
| **Description** | Apply the correct payroll rules based on country and effective period. Support future compliance changes without schema modifications. |
| **Mechanism** | Every rule entity has `effective_from` (DATE, NOT NULL), `effective_to` (DATE, NULL = active), `is_active` (BOOLEAN). |
| **Query Filter** | `WHERE effective_from <= :date AND (effective_to IS NULL OR effective_to >= :date) AND is_active = true` |
| **Acceptance Criteria** | Rules for FY 2025–26 and FY 2026–27 can coexist in the database. The engine selects the correct set based on `effective_date` input. |

---

### FR-11: Extensible Country Framework

| Field | Detail |
|-------|--------|
| **ID** | FR-11 |
| **Priority** | P0 — Must Have |
| **Description** | Enable onboarding of new countries with minimal code changes through configurable rule definitions. |
| **Onboarding Steps** | |

| Step | Action | Code Change? |
|------|--------|--------------|
| 1 | Insert country record via API | No |
| 2 | Insert tax regimes for country | No |
| 3 | Insert salary components with calculation rules | No |
| 4 | Insert tax slabs per regime | No |
| 5 | Insert statutory contribution rules | No |
| 6 | Insert deduction sections | No |
| 7 | Add exchange rate to constants file | Minimal (one line) |

| **Acceptance Criteria** | A new country can be onboarded by inserting configuration data via API endpoints. No engine code changes required unless the country's calculation flow is fundamentally different. |

---

### FR-12: Admin CRUD Operations

| Field | Detail |
|-------|--------|
| **ID** | FR-12 |
| **Priority** | P0 — Must Have |
| **Description** | Provide CRUD REST endpoints for managing all configuration entities. |
| **Entities** | Countries, Tax Regimes, Salary Components, Component Conditions, Tax Slabs, Tax Surcharges, Tax Cess Rules, Statutory Contributions, Deduction Sections |
| **Auth** | None — external auth provider assumed. |
| **Acceptance Criteria** | All config entities manageable via REST API. Duplicate entries rejected with `409`. Not-found returns `404`. |

---

### FR-13: Currency Conversion (Informational)

| Field | Detail |
|-------|--------|
| **ID** | FR-13 |
| **Priority** | P1 — Should Have |
| **Description** | Optionally convert the payroll breakdown to a specified output currency using exchange rates. |
| **MVP Source** | Static constants file (`exchange-rates.constant.ts`) |
| **Behavior** | If `output_currency` differs from country's native currency, include a `converted` section in the response. Primary amounts always in native currency. |
| **Acceptance Criteria** | Conversion applied correctly using static rate. Unsupported currency returns `400`. |

---

## 2. Non-Functional Requirements

### NFR-01: Performance

| Metric | Target |
|--------|--------|
| Single calculation response time | < 200ms (p95) |
| Admin CRUD response time | < 100ms (p95) |
| Concurrent calculations | Support 100 concurrent requests |
| Database query optimization | Use indexes on `country_id`, `effective_from`, `effective_to`, `is_active` |

---

### NFR-02: Scalability

| Aspect | Strategy |
|--------|----------|
| Horizontal scaling | Stateless design — add instances behind load balancer |
| Database connections | Connection pooling via TypeORM (default: 10, configurable) |
| Caching | Rule configurations cacheable (infrequent updates). Use NestJS `CacheModule` with TTL. |
| No shared state | No in-memory state between requests |

---

### NFR-03: Maintainability

| Aspect | Strategy |
|--------|----------|
| Code organization | Modular monolith — each domain in its own NestJS module |
| Rule updates | DB-driven — no code changes for tax rule updates |
| Migration management | TypeORM migrations for schema changes |
| Separation of concerns | Controller → Service → Repository layers |

---

### NFR-04: Reliability

| Aspect | Strategy |
|--------|----------|
| Input validation | `class-validator` decorators on all DTOs |
| Error handling | Global exception filter with structured error responses |
| Data integrity | DB constraints (UNIQUE, FK, CHECK), effective dating validation |
| Idempotency | Calculation is stateless — same input always produces same output |

---

### NFR-05: Extensibility

| Aspect | Strategy |
|--------|----------|
| New countries | DB configuration only — no engine code changes |
| New tax regimes | Add rows to `tax_regimes`, `tax_slabs` |
| New contribution types | Add rows to `statutory_contributions` |
| Calculation flow changes | Service interfaces support future Strategy pattern adoption |
| Exchange rate provider | `ExchangeRateProvider` interface — swap implementations |

---

### NFR-06: Security (MVP Scope)

| Aspect | Strategy |
|--------|----------|
| Authentication | External — not in scope |
| Input sanitization | `class-validator` + `class-transformer` pipes |
| SQL injection | TypeORM parameterized queries |
| Rate limiting | Not in MVP scope (external API gateway assumed) |
| CORS | Configurable via NestJS `app.enableCors()` |

---

### NFR-07: Observability

| Aspect | Strategy |
|--------|----------|
| Logging | NestJS built-in logger. Structured JSON in production. |
| Health check | `GET /health` endpoint — DB connectivity check |
| Request tracing | Correlation ID via interceptor |
| Error tracking | Structured error responses with error codes |

---

### NFR-08: Data Integrity

| Aspect | Strategy |
|--------|----------|
| Effective dating | No overlapping active rules for same entity (DB constraint + validation) |
| Unique constraints | `(country_id, code, effective_from)` composite unique on rule entities |
| Foreign keys | All relationships enforced via FK constraints |
| Cascades | Soft delete via `is_active` flag — no hard deletes on rules |
| Currency codes | ISO 4217 validation |
| Country codes | ISO 3166-1 alpha-2 validation |
