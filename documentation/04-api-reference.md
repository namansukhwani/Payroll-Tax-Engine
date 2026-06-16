# Payroll Tax Engine — API Reference

> **Version**: 1.0.0  
> **Date**: 2026-06-16  
> **Base URL**: `/api/v1`  
> **Auth**: None (external auth provider assumed)  
> **Content-Type**: `application/json`  

---

## 1. Standard Response Envelope

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-16T14:00:00.000Z"
}
```

### Success Response (Paginated)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "timestamp": "2026-06-16T14:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "annual_ctc",
        "message": "annual_ctc must be a positive number"
      }
    ]
  },
  "timestamp": "2026-06-16T14:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_TAX_REGIME` | 400 | Tax regime not valid for the specified country |
| `INVALID_CTC` | 400 | CTC is negative, zero, or non-numeric |
| `UNSUPPORTED_CURRENCY` | 400 | Output currency not found in exchange rates |
| `COUNTRY_NOT_FOUND` | 404 | Country code does not exist |
| `ENTITY_NOT_FOUND` | 404 | Requested entity does not exist |
| `DUPLICATE_ENTRY` | 409 | Entity with same unique key already exists |
| `NO_ACTIVE_RULES` | 422 | No active rules found for country + effective date |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 2. Calculation API

### 2.1 Calculate Payroll Breakdown

The core computation endpoint. Stateless — no data persisted.

```
POST /api/v1/calculate/payroll
```

#### Request Body

```json
{
  "country_code": "IN",
  "annual_ctc": 1200000,
  "tax_regime_code": "NEW_REGIME",
  "is_metro": true,
  "employee_age": 30,
  "claimed_deductions": {
    "SECTION_80C": 150000,
    "SECTION_80D": 25000
  },
  "effective_date": "2025-04-01",
  "output_currency": "USD"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `country_code` | `string` | ✅ | — | ISO 3166-1 alpha-2 country code |
| `annual_ctc` | `number` | ✅ | — | Annual Cost to Company (positive, > 0) |
| `tax_regime_code` | `string` | ✅ | — | Tax regime code (e.g., `OLD_REGIME`, `NEW_REGIME`) |
| `is_metro` | `boolean` | ❌ | `false` | Metro city flag (affects HRA % for India) |
| `employee_age` | `number` | ❌ | `30` | Employee age (affects senior citizen slabs) |
| `claimed_deductions` | `object` | ❌ | `{}` | Key-value map of deduction section codes to claimed amounts |
| `effective_date` | `string` | ❌ | Current date | ISO 8601 date for rule versioning |
| `output_currency` | `string` | ❌ | Country's currency | ISO 4217 code for currency conversion |

#### Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "country": {
      "code": "IN",
      "name": "India",
      "currency_code": "INR",
      "currency_symbol": "₹",
      "fiscal_year_start_month": 4
    },
    "input": {
      "annual_ctc": 1200000,
      "tax_regime": {
        "code": "NEW_REGIME",
        "name": "New Tax Regime"
      },
      "is_metro": true,
      "employee_age": 30,
      "effective_date": "2025-04-01"
    },
    "salary_breakdown": {
      "annual": {
        "basic": 480000,
        "hra": 240000,
        "special_allowance": 135312,
        "gross_salary": 855312
      },
      "monthly": {
        "basic": 40000,
        "hra": 20000,
        "special_allowance": 11276,
        "gross_salary": 71276
      }
    },
    "employer_contributions": {
      "annual": {
        "epf": 21600,
        "esi": 0,
        "gratuity": 23088,
        "total": 44688
      },
      "monthly": {
        "epf": 1800,
        "esi": 0,
        "gratuity": 1924,
        "total": 3724
      }
    },
    "employee_deductions": {
      "annual": {
        "epf": 21600,
        "esi": 0,
        "professional_tax": 2400,
        "income_tax": 46822,
        "total": 70822
      },
      "monthly": {
        "epf": 1800,
        "esi": 0,
        "professional_tax": 200,
        "income_tax": 3902,
        "total": 5902
      }
    },
    "tax_calculation": {
      "gross_taxable_income": 855312,
      "deductions_applied": {
        "standard_deduction": 75000,
        "total": 75000
      },
      "net_taxable_income": 780312,
      "slab_wise_tax": [
        { "slab": "0 - 4,00,000", "rate": "0%", "tax": 0 },
        { "slab": "4,00,001 - 8,00,000", "rate": "5%", "tax": 20000 },
        { "slab": "8,00,001 - 7,80,312", "rate": "10%", "tax": 0 }
      ],
      "base_tax": 20000,
      "surcharge": 0,
      "cess": 800,
      "total_annual_tax": 20800,
      "monthly_tds": 1733
    },
    "net_salary": {
      "annual": 784490,
      "monthly": 65374
    },
    "total_employer_cost": {
      "annual": 1200000,
      "monthly": 100000
    },
    "currency": {
      "primary": "INR",
      "converted": {
        "currency_code": "USD",
        "exchange_rate": 0.012,
        "net_salary_annual": 9413.88,
        "net_salary_monthly": 784.49,
        "total_employer_cost_annual": 14400,
        "total_employer_cost_monthly": 1200
      }
    }
  },
  "timestamp": "2026-06-16T14:00:00.000Z"
}
```

#### Error Responses

| Scenario | Status | Code |
|----------|--------|------|
| Missing `country_code` or `annual_ctc` | `400` | `VALIDATION_ERROR` |
| `annual_ctc <= 0` | `400` | `INVALID_CTC` |
| Unknown `country_code` | `404` | `COUNTRY_NOT_FOUND` |
| Invalid `tax_regime_code` for country | `400` | `INVALID_TAX_REGIME` |
| No active rules for effective date | `422` | `NO_ACTIVE_RULES` |
| Unsupported `output_currency` | `400` | `UNSUPPORTED_CURRENCY` |

---

## 3. Country Management API

### 3.1 Create Country

```
POST /api/v1/countries
```

**Request Body:**

```json
{
  "code": "IN",
  "name": "India",
  "currency_code": "INR",
  "currency_symbol": "₹",
  "fiscal_year_start_month": 4
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | ISO 3166-1 alpha-2 (2 chars, uppercase) |
| `name` | `string` | ✅ | Full country name |
| `currency_code` | `string` | ✅ | ISO 4217 (3 chars, uppercase) |
| `currency_symbol` | `string` | ✅ | Display symbol |
| `fiscal_year_start_month` | `number` | ✅ | 1–12 |

**Response:** `201 Created` — Created country object

---

### 3.2 List Countries

```
GET /api/v1/countries
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max: 100) |
| `is_active` | `boolean` | `true` | Filter by active status |

**Response:** `200 OK` — Paginated list of countries

---

### 3.3 Get Country by Code

```
GET /api/v1/countries/:code
```

**Response:** `200 OK` — Country object  
**Error:** `404` — `COUNTRY_NOT_FOUND`

---

### 3.4 Update Country

```
PATCH /api/v1/countries/:code
```

**Request Body:** Partial country fields (any subset of create fields except `code`)

**Response:** `200 OK` — Updated country object

---

### 3.5 Delete Country (Soft)

```
DELETE /api/v1/countries/:code
```

**Behavior:** Sets `is_active = false`. Does not remove the record.

**Response:** `200 OK`

---

## 4. Tax Regime Management API

### 4.1 Create Tax Regime

```
POST /api/v1/countries/:countryCode/tax-regimes
```

**Request Body:**

```json
{
  "code": "NEW_REGIME",
  "name": "New Tax Regime",
  "description": "Simplified tax regime with fewer exemptions, introduced in Budget 2020",
  "is_default": false,
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | Unique code within country + effective_from |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | ❌ | Human-readable description |
| `is_default` | `boolean` | ❌ | Default regime for this country (default: `false`) |
| `effective_from` | `string` | ✅ | ISO 8601 date |
| `effective_to` | `string` | ❌ | ISO 8601 date or `null` |

**Response:** `201 Created`  
**Error:** `409` — `DUPLICATE_ENTRY` if `(countryCode, code, effective_from)` exists

---

### 4.2 List Tax Regimes for Country

```
GET /api/v1/countries/:countryCode/tax-regimes
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `effective_date` | `string` | Current date | Filter by effective date |
| `is_active` | `boolean` | `true` | Filter by active status |

**Response:** `200 OK` — List of tax regimes

---

### 4.3 Get Tax Regime

```
GET /api/v1/countries/:countryCode/tax-regimes/:regimeId
```

**Response:** `200 OK` — Tax regime object with related slabs, surcharges, and cess rules

---

### 4.4 Update Tax Regime

```
PATCH /api/v1/countries/:countryCode/tax-regimes/:regimeId
```

---

### 4.5 Delete Tax Regime (Soft)

```
DELETE /api/v1/countries/:countryCode/tax-regimes/:regimeId
```

---

## 5. Salary Component Management API

### 5.1 Create Salary Component

```
POST /api/v1/countries/:countryCode/salary-components
```

**Request Body:**

```json
{
  "code": "BASIC",
  "name": "Basic Salary",
  "component_type": "EARNING",
  "calculation_type": "PERCENTAGE",
  "calculation_base": "CTC",
  "default_value": 40.0,
  "min_value": null,
  "max_value": null,
  "wage_ceiling": null,
  "is_taxable": true,
  "is_mandatory": true,
  "display_order": 1,
  "effective_from": "2025-04-01",
  "effective_to": null,
  "conditions": [
    {
      "condition_type": "LOCATION",
      "condition_operator": "EQ",
      "condition_value": "METRO",
      "override_value": 50.0,
      "override_calculation_base": null
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | Unique code within country + effective_from |
| `name` | `string` | ✅ | Display name |
| `component_type` | `enum` | ✅ | `EARNING`, `DEDUCTION`, `EMPLOYER_CONTRIBUTION` |
| `calculation_type` | `enum` | ✅ | `PERCENTAGE`, `FIXED`, `BALANCING` |
| `calculation_base` | `string` | ❌ | Base component code for percentage calc |
| `default_value` | `number` | ❌ | Percentage or fixed amount |
| `min_value` | `number` | ❌ | Minimum value floor |
| `max_value` | `number` | ❌ | Maximum value cap |
| `wage_ceiling` | `number` | ❌ | Max base amount for calc |
| `is_taxable` | `boolean` | ❌ | Default: `true` |
| `is_mandatory` | `boolean` | ❌ | Default: `true` |
| `display_order` | `number` | ✅ | Calculation priority |
| `effective_from` | `string` | ✅ | ISO 8601 date |
| `effective_to` | `string` | ❌ | ISO 8601 date or `null` |
| `conditions` | `array` | ❌ | Conditional overrides |

**Response:** `201 Created`

---

### 5.2 List Salary Components

```
GET /api/v1/countries/:countryCode/salary-components
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `effective_date` | `string` | Current date | Filter by effective date |
| `component_type` | `string` | — | Filter by type |
| `is_active` | `boolean` | `true` | Filter by active status |

**Response:** `200 OK` — List with embedded conditions

---

### 5.3 Get Salary Component

```
GET /api/v1/countries/:countryCode/salary-components/:componentId
```

---

### 5.4 Update Salary Component

```
PATCH /api/v1/countries/:countryCode/salary-components/:componentId
```

---

### 5.5 Delete Salary Component (Soft)

```
DELETE /api/v1/countries/:countryCode/salary-components/:componentId
```

---

## 6. Tax Slab Management API

### 6.1 Create Tax Slab

```
POST /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs
```

**Request Body:**

```json
{
  "min_amount": 400001,
  "max_amount": 800000,
  "rate_percentage": 5.0,
  "display_order": 2,
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `min_amount` | `number` | ✅ | Slab lower bound (inclusive) |
| `max_amount` | `number` | ❌ | Slab upper bound. `null` for top slab. |
| `rate_percentage` | `number` | ✅ | Tax rate for this slab |
| `display_order` | `number` | ✅ | Slab order (ascending) |
| `effective_from` | `string` | ✅ | ISO 8601 date |
| `effective_to` | `string` | ❌ | ISO 8601 date or `null` |

**Response:** `201 Created`

---

### 6.2 List Tax Slabs for Regime

```
GET /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs
```

**Query Parameters:** `effective_date`, `is_active`

**Response:** `200 OK` — Ordered list of slabs

---

### 6.3 Update Tax Slab

```
PATCH /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs/:slabId
```

---

### 6.4 Delete Tax Slab (Soft)

```
DELETE /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs/:slabId
```

---

## 7. Tax Surcharge Management API

### 7.1 Create Tax Surcharge

```
POST /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges
```

**Request Body:**

```json
{
  "min_income": 5000000,
  "max_income": 10000000,
  "rate_percentage": 10.0,
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

**Response:** `201 Created`

---

### 7.2 List Tax Surcharges

```
GET /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges
```

---

### 7.3 Update / Delete Tax Surcharge

```
PATCH /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges/:surchargeId
DELETE /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges/:surchargeId
```

---

## 8. Tax Cess Management API

### 8.1 Create Tax Cess Rule

```
POST /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess
```

**Request Body:**

```json
{
  "name": "Health & Education Cess",
  "rate_percentage": 4.0,
  "applies_on": "TAX_PLUS_SURCHARGE",
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

**Response:** `201 Created`

---

### 8.2 List / Update / Delete Tax Cess Rules

```
GET    /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess
PATCH  /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess/:cessId
DELETE /api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess/:cessId
```

---

## 9. Statutory Contribution Management API

### 9.1 Create Statutory Contribution

```
POST /api/v1/countries/:countryCode/statutory-contributions
```

**Request Body:**

```json
{
  "code": "EPF_EMPLOYEE",
  "name": "Employee Provident Fund (Employee Share)",
  "contribution_side": "EMPLOYEE",
  "calculation_type": "PERCENTAGE",
  "calculation_base": "BASIC",
  "rate_percentage": 12.0,
  "wage_ceiling": 15000,
  "max_contribution": null,
  "threshold_min": null,
  "threshold_max": null,
  "is_mandatory": true,
  "display_order": 1,
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | Unique code within country + effective_from |
| `name` | `string` | ✅ | Display name |
| `contribution_side` | `enum` | ✅ | `EMPLOYEE` or `EMPLOYER` |
| `calculation_type` | `enum` | ✅ | `PERCENTAGE` or `FIXED` |
| `calculation_base` | `string` | ❌ | Base for percentage (e.g., `BASIC`, `GROSS`) |
| `rate_percentage` | `number` | ❌ | Rate as percentage |
| `wage_ceiling` | `number` | ❌ | Max monthly base for calc |
| `max_contribution` | `number` | ❌ | Maximum monthly contribution |
| `threshold_min` | `number` | ❌ | Minimum monthly salary for eligibility |
| `threshold_max` | `number` | ❌ | Maximum monthly salary for eligibility |
| `is_mandatory` | `boolean` | ❌ | Default: `true` |
| `display_order` | `number` | ✅ | Calculation order |
| `effective_from` | `string` | ✅ | ISO 8601 date |
| `effective_to` | `string` | ❌ | ISO 8601 date or `null` |

**Response:** `201 Created`

---

### 9.2 List Statutory Contributions

```
GET /api/v1/countries/:countryCode/statutory-contributions
```

**Query Parameters:** `effective_date`, `contribution_side`, `is_active`

---

### 9.3 Get / Update / Delete Statutory Contribution

```
GET    /api/v1/countries/:countryCode/statutory-contributions/:contributionId
PATCH  /api/v1/countries/:countryCode/statutory-contributions/:contributionId
DELETE /api/v1/countries/:countryCode/statutory-contributions/:contributionId
```

---

## 10. Deduction Section Management API

### 10.1 Create Deduction Section

```
POST /api/v1/countries/:countryCode/deduction-sections
```

**Request Body:**

```json
{
  "regime_id": "uuid-of-old-regime",
  "code": "SECTION_80C",
  "name": "Section 80C Deduction",
  "description": "Investments in PPF, ELSS, LIC, EPF, etc.",
  "max_limit": 150000,
  "is_applicable_all_regimes": false,
  "display_order": 1,
  "effective_from": "2025-04-01",
  "effective_to": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `regime_id` | `string` | ❌ | Specific regime. `null` if `is_applicable_all_regimes = true` |
| `code` | `string` | ✅ | Section code |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | ❌ | Human-readable explanation |
| `max_limit` | `number` | ❌ | Maximum deduction. `null` = no limit |
| `is_applicable_all_regimes` | `boolean` | ❌ | Default: `false` |
| `display_order` | `number` | ✅ | Display order |
| `effective_from` | `string` | ✅ | ISO 8601 date |
| `effective_to` | `string` | ❌ | ISO 8601 date or `null` |

**Response:** `201 Created`

---

### 10.2 List Deduction Sections

```
GET /api/v1/countries/:countryCode/deduction-sections
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `effective_date` | `string` | Current date | Filter by effective date |
| `regime_id` | `string` | — | Filter by regime (includes `is_applicable_all_regimes = true`) |
| `is_active` | `boolean` | `true` | Filter by active status |

---

### 10.3 Get / Update / Delete Deduction Section

```
GET    /api/v1/countries/:countryCode/deduction-sections/:sectionId
PATCH  /api/v1/countries/:countryCode/deduction-sections/:sectionId
DELETE /api/v1/countries/:countryCode/deduction-sections/:sectionId
```

---

## 11. Health Check API

```
GET /health
```

**Response:** `200 OK`

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600,
  "timestamp": "2026-06-16T14:00:00.000Z"
}
```

---

## 12. API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Calculation** | | |
| `POST` | `/api/v1/calculate/payroll` | Calculate payroll breakdown |
| **Countries** | | |
| `POST` | `/api/v1/countries` | Create country |
| `GET` | `/api/v1/countries` | List countries |
| `GET` | `/api/v1/countries/:code` | Get country by code |
| `PATCH` | `/api/v1/countries/:code` | Update country |
| `DELETE` | `/api/v1/countries/:code` | Soft delete country |
| **Tax Regimes** | | |
| `POST` | `/api/v1/countries/:countryCode/tax-regimes` | Create tax regime |
| `GET` | `/api/v1/countries/:countryCode/tax-regimes` | List tax regimes |
| `GET` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId` | Get tax regime |
| `PATCH` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId` | Update tax regime |
| `DELETE` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId` | Soft delete tax regime |
| **Salary Components** | | |
| `POST` | `/api/v1/countries/:countryCode/salary-components` | Create salary component |
| `GET` | `/api/v1/countries/:countryCode/salary-components` | List salary components |
| `GET` | `/api/v1/countries/:countryCode/salary-components/:componentId` | Get salary component |
| `PATCH` | `/api/v1/countries/:countryCode/salary-components/:componentId` | Update salary component |
| `DELETE` | `/api/v1/countries/:countryCode/salary-components/:componentId` | Soft delete salary component |
| **Tax Slabs** | | |
| `POST` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs` | Create tax slab |
| `GET` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs` | List tax slabs |
| `PATCH` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs/:slabId` | Update tax slab |
| `DELETE` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-slabs/:slabId` | Soft delete tax slab |
| **Tax Surcharges** | | |
| `POST` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges` | Create surcharge |
| `GET` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges` | List surcharges |
| `PATCH` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges/:surchargeId` | Update surcharge |
| `DELETE` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-surcharges/:surchargeId` | Soft delete surcharge |
| **Tax Cess** | | |
| `POST` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess` | Create cess rule |
| `GET` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess` | List cess rules |
| `PATCH` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess/:cessId` | Update cess rule |
| `DELETE` | `/api/v1/countries/:countryCode/tax-regimes/:regimeId/tax-cess/:cessId` | Soft delete cess rule |
| **Statutory Contributions** | | |
| `POST` | `/api/v1/countries/:countryCode/statutory-contributions` | Create contribution |
| `GET` | `/api/v1/countries/:countryCode/statutory-contributions` | List contributions |
| `GET` | `/api/v1/countries/:countryCode/statutory-contributions/:contributionId` | Get contribution |
| `PATCH` | `/api/v1/countries/:countryCode/statutory-contributions/:contributionId` | Update contribution |
| `DELETE` | `/api/v1/countries/:countryCode/statutory-contributions/:contributionId` | Soft delete contribution |
| **Deduction Sections** | | |
| `POST` | `/api/v1/countries/:countryCode/deduction-sections` | Create deduction section |
| `GET` | `/api/v1/countries/:countryCode/deduction-sections` | List deduction sections |
| `GET` | `/api/v1/countries/:countryCode/deduction-sections/:sectionId` | Get deduction section |
| `PATCH` | `/api/v1/countries/:countryCode/deduction-sections/:sectionId` | Update deduction section |
| `DELETE` | `/api/v1/countries/:countryCode/deduction-sections/:sectionId` | Soft delete deduction section |
| **Health** | | |
| `GET` | `/health` | Health check |
