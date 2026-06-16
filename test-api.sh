#!/usr/bin/env bash
# ============================================================
# TaxCalculator API Test Script
# Tests all endpoints from documentation/04-api-reference.md
# Usage: ./test-api.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
API="$BASE_URL/api/v1"

# ---- Counters -----------------------------------------------
PASS=0
FAIL=0
SKIP=0

# ---- State (IDs collected during run) -----------------------
COUNTRY_CODE="TS"
REGIME_ID=""
SLAB_ID=""
SURCHARGE_ID=""
CESS_ID=""
COMPONENT_CODE=""
CONTRIBUTION_ID=""
DEDUCTION_ID=""

# ---- Colors -------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---- Helpers ------------------------------------------------
section() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
}

pass() {
  echo -e "  ${GREEN}✓${NC} $1"
  ((PASS++))
}

fail() {
  echo -e "  ${RED}✗${NC} $1"
  echo -e "    ${RED}Response:${NC} $2"
  ((FAIL++))
}

skip() {
  echo -e "  ${YELLOW}⊘${NC} $1 (skipped: $2)"
  ((SKIP++))
}

# $1 = test name, $2 = expected HTTP status, $3 = actual HTTP status, $4 = body
assert_status() {
  local name="$1" expected="$2" actual="$3" body="$4"
  if [[ "$actual" == "$expected" ]]; then
    pass "$name → HTTP $actual"
  else
    fail "$name → expected HTTP $expected, got HTTP $actual" "$body"
  fi
}

# Extract field from JSON (no jq dependency — uses python3 which ships with macOS)
json_get() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

# POST helper — returns "<status>|<body>"
post() {
  local url="$1" data="$2"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$data")
  local body status
  body=$(echo "$resp" | sed '$d')
  status=$(echo "$resp" | tail -n1)
  echo "${status}|${body}"
}

# GET helper
get() {
  local url="$1"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X GET "$url")
  local body status
  body=$(echo "$resp" | sed '$d')
  status=$(echo "$resp" | tail -n1)
  echo "${status}|${body}"
}

# PATCH helper
patch() {
  local url="$1" data="$2"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X PATCH "$url" \
    -H "Content-Type: application/json" \
    -d "$data")
  local body status
  body=$(echo "$resp" | sed '$d')
  status=$(echo "$resp" | tail -n1)
  echo "${status}|${body}"
}

# DELETE helper
delete() {
  local url="$1"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X DELETE "$url")
  local body status
  body=$(echo "$resp" | sed '$d')
  status=$(echo "$resp" | tail -n1)
  echo "${status}|${body}"
}

split_status() { echo "$1" | cut -d'|' -f1; }
split_body()   { echo "$1" | cut -d'|' -f2-; }

# ============================================================
echo ""
echo -e "${BOLD}TaxCalculator API Tests${NC}"
echo -e "Target: ${CYAN}$BASE_URL${NC}"
echo ""

# ---- 0. Pre-flight check ------------------------------------
section "0. Health Check"

r=$(get "$BASE_URL/health")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET /health returns 200" "200" "$s" "$b"

if [[ "$s" != "200" ]]; then
  echo ""
  echo -e "${RED}Server not reachable at $BASE_URL — aborting.${NC}"
  echo -e "Start the server with: ${CYAN}npm run start:dev${NC}"
  exit 1
fi

# ============================================================
section "1. Country Management"

# 1.1 Create country
r=$(post "$API/countries" '{
  "code": "TS",
  "name": "Test Country",
  "currencyCode": "TST",
  "currencySymbol": "T$",
  "fiscalYearStartMonth": 1
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /countries — create" "201" "$s" "$b"

# 1.2 Duplicate create → 409
r=$(post "$API/countries" '{
  "code": "TS",
  "name": "Test Country",
  "currencyCode": "TST",
  "currencySymbol": "T$",
  "fiscalYearStartMonth": 1
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /countries — duplicate → 409" "409" "$s" "$b"

# 1.3 Validation error — missing name
r=$(post "$API/countries" '{"code":"TX","currencyCode":"TXX","currencySymbol":"X","fiscalYearStartMonth":1}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /countries — missing name → 400" "400" "$s" "$b"

# 1.4 List countries
r=$(get "$API/countries")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET /countries — list" "200" "$s" "$b"

# 1.5 Get by code
r=$(get "$API/countries/$COUNTRY_CODE")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET /countries/$COUNTRY_CODE — get by code" "200" "$s" "$b"

# 1.6 Get non-existent country
r=$(get "$API/countries/ZZ")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET /countries/ZZ — not found → 404" "404" "$s" "$b"

# 1.7 Update country
r=$(patch "$API/countries/$COUNTRY_CODE" '{"name":"Test Country Updated"}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "PATCH /countries/$COUNTRY_CODE — update" "200" "$s" "$b"

# ============================================================
section "2. Tax Regime Management"

# 2.1 Create tax regime
r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes" '{
  "code": "STANDARD",
  "name": "Standard Regime",
  "description": "Test standard tax regime",
  "isDefault": true,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /countries/$COUNTRY_CODE/tax-regimes — create" "201" "$s" "$b"

REGIME_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
if [[ -z "$REGIME_ID" ]]; then
  skip "tax-regime sub-tests" "could not extract regime ID from response: $b"
else
  echo -e "  ${YELLOW}regime_id:${NC} $REGIME_ID"

  # 2.2 Duplicate → 409
  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes" '{
    "code": "STANDARD",
    "name": "Standard Regime",
    "effectiveFrom": "2025-01-01"
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-regimes — duplicate → 409" "409" "$s" "$b"

  # 2.3 List regimes
  r=$(get "$API/countries/$COUNTRY_CODE/tax-regimes")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET tax-regimes — list" "200" "$s" "$b"

  # 2.4 Get by ID
  r=$(get "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET tax-regimes/:id — get" "200" "$s" "$b"

  # 2.5 Update regime
  r=$(patch "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID" '{"description":"Updated description"}')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "PATCH tax-regimes/:id — update" "200" "$s" "$b"
fi

# Regime for non-existent country → 404
r=$(get "$API/countries/ZZ/tax-regimes")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET tax-regimes — invalid country → 404" "404" "$s" "$b"

# ============================================================
section "3. Tax Slab Management"

if [[ -z "$REGIME_ID" ]]; then
  skip "Tax Slab tests" "no regime ID"
else
  # 3.1 Create slabs
  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs" '{
    "minAmount": 0,
    "maxAmount": 300000,
    "ratePercentage": 0.0,
    "displayOrder": 1,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-slabs — slab 1 (0%)" "201" "$s" "$b"
  SLAB_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs" '{
    "minAmount": 300001,
    "maxAmount": 700000,
    "ratePercentage": 10.0,
    "displayOrder": 2,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-slabs — slab 2 (10%)" "201" "$s" "$b"

  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs" '{
    "minAmount": 700001,
    "maxAmount": null,
    "ratePercentage": 20.0,
    "displayOrder": 3,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-slabs — slab 3 (20%, top)" "201" "$s" "$b"

  # Validation — missing ratePercentage
  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs" '{"minAmount":0,"displayOrder":99,"effectiveFrom":"2025-01-01"}')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-slabs — missing rate → 400" "400" "$s" "$b"

  # List slabs
  r=$(get "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET tax-slabs — list" "200" "$s" "$b"

  if [[ -n "$SLAB_ID" ]]; then
    # Update slab
    r=$(patch "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs/$SLAB_ID" '{"ratePercentage":0.0}')
    s=$(split_status "$r"); b=$(split_body "$r")
    assert_status "PATCH tax-slabs/:id — update" "200" "$s" "$b"
  fi
fi

# ============================================================
section "4. Tax Surcharge Management"

if [[ -z "$REGIME_ID" ]]; then
  skip "Tax Surcharge tests" "no regime ID"
else
  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-surcharges" '{
    "minIncome": 5000000,
    "maxIncome": 10000000,
    "ratePercentage": 10.0,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-surcharges — create" "201" "$s" "$b"
  SURCHARGE_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

  # List
  r=$(get "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-surcharges")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET tax-surcharges — list" "200" "$s" "$b"

  if [[ -n "$SURCHARGE_ID" ]]; then
    r=$(patch "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-surcharges/$SURCHARGE_ID" '{"ratePercentage":12.0}')
    s=$(split_status "$r"); b=$(split_body "$r")
    assert_status "PATCH tax-surcharges/:id — update" "200" "$s" "$b"
  fi
fi

# ============================================================
section "5. Tax Cess Management"

if [[ -z "$REGIME_ID" ]]; then
  skip "Tax Cess tests" "no regime ID"
else
  r=$(post "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-cess" '{
    "cessName": "Education Cess",
    "ratePercentage": 4.0,
    "appliesOn": "TAX_PLUS_SURCHARGE",
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST tax-cess — create" "201" "$s" "$b"
  CESS_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

  # List
  r=$(get "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-cess")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET tax-cess — list" "200" "$s" "$b"

  if [[ -n "$CESS_ID" ]]; then
    r=$(patch "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-cess/$CESS_ID" '{"ratePercentage":3.0}')
    s=$(split_status "$r"); b=$(split_body "$r")
    assert_status "PATCH tax-cess/:id — update" "200" "$s" "$b"
  fi
fi

# ============================================================
section "6. Salary Component Management"

# 6.1 Create BASIC component
r=$(post "$API/countries/$COUNTRY_CODE/salary-components" '{
  "code": "BASIC",
  "componentName": "Basic Salary",
  "componentType": "EARNING",
  "calculationType": "PERCENTAGE",
  "calculationBase": "CTC",
  "defaultValue": 40.0,
  "isTaxable": true,
  "isMandatory": true,
  "displayOrder": 1,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null,
  "conditions": []
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST salary-components — BASIC (EARNING, PERCENTAGE)" "201" "$s" "$b"
COMPONENT_CODE=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('code',''))" 2>/dev/null)

# 6.2 Create HRA with conditions
r=$(post "$API/countries/$COUNTRY_CODE/salary-components" '{
  "code": "HRA",
  "componentName": "House Rent Allowance",
  "componentType": "EARNING",
  "calculationType": "PERCENTAGE",
  "calculationBase": "BASIC",
  "defaultValue": 40.0,
  "isTaxable": false,
  "isMandatory": true,
  "displayOrder": 2,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null,
  "conditions": [
    {
      "conditionType": "LOCATION",
      "conditionOperator": "EQ",
      "conditionValue": "METRO",
      "overrideValue": 50.0,
      "overrideCalculationBase": null
    }
  ]
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST salary-components — HRA with METRO condition" "201" "$s" "$b"

# 6.3 Create SPECIAL_ALLOWANCE (BALANCING)
r=$(post "$API/countries/$COUNTRY_CODE/salary-components" '{
  "code": "SPECIAL_ALLOWANCE",
  "componentName": "Special Allowance",
  "componentType": "EARNING",
  "calculationType": "BALANCING",
  "isTaxable": true,
  "isMandatory": true,
  "displayOrder": 3,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST salary-components — SPECIAL_ALLOWANCE (BALANCING)" "201" "$s" "$b"

# 6.4 Invalid componentType → 400
r=$(post "$API/countries/$COUNTRY_CODE/salary-components" '{
  "code": "BAD",
  "componentName": "Bad",
  "componentType": "INVALID_TYPE",
  "calculationType": "FIXED",
  "displayOrder": 99,
  "effectiveFrom": "2025-01-01"
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST salary-components — invalid type → 400" "400" "$s" "$b"

# 6.5 List
r=$(get "$API/countries/$COUNTRY_CODE/salary-components")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET salary-components — list" "200" "$s" "$b"

if [[ -n "$COMPONENT_CODE" ]]; then
  # 6.6 Get by code
  r=$(get "$API/countries/$COUNTRY_CODE/salary-components/$COMPONENT_CODE")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET salary-components/:code — get" "200" "$s" "$b"

  # 6.7 Update
  r=$(patch "$API/countries/$COUNTRY_CODE/salary-components/$COMPONENT_CODE" '{"defaultValue":45.0}')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "PATCH salary-components/:code — update" "200" "$s" "$b"
fi

# ============================================================
section "7. Statutory Contribution Management"

# 7.1 Create employee contribution
r=$(post "$API/countries/$COUNTRY_CODE/statutory-contributions" '{
  "code": "PF_EMPLOYEE",
  "contributionName": "Provident Fund (Employee)",
  "contributionSide": "EMPLOYEE",
  "calculationType": "PERCENTAGE",
  "calculationBase": "BASIC",
  "ratePercentage": 12.0,
  "wageCeiling": 15000,
  "isMandatory": true,
  "displayOrder": 1,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST statutory-contributions — EMPLOYEE (PF)" "201" "$s" "$b"
CONTRIBUTION_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# 7.2 Create employer contribution
r=$(post "$API/countries/$COUNTRY_CODE/statutory-contributions" '{
  "code": "PF_EMPLOYER",
  "contributionName": "Provident Fund (Employer)",
  "contributionSide": "EMPLOYER",
  "calculationType": "PERCENTAGE",
  "calculationBase": "BASIC",
  "ratePercentage": 12.0,
  "wageCeiling": 15000,
  "isMandatory": true,
  "displayOrder": 2,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST statutory-contributions — EMPLOYER (PF)" "201" "$s" "$b"

# 7.3 Invalid contributionSide → 400
r=$(post "$API/countries/$COUNTRY_CODE/statutory-contributions" '{
  "code": "BAD",
  "contributionName": "Bad",
  "contributionSide": "BOTH",
  "calculationType": "PERCENTAGE",
  "displayOrder": 99,
  "effectiveFrom": "2025-01-01"
}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST statutory-contributions — invalid side → 400" "400" "$s" "$b"

# 7.4 List
r=$(get "$API/countries/$COUNTRY_CODE/statutory-contributions")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET statutory-contributions — list" "200" "$s" "$b"

if [[ -n "$CONTRIBUTION_ID" ]]; then
  # 7.5 Get by ID
  r=$(get "$API/countries/$COUNTRY_CODE/statutory-contributions/$CONTRIBUTION_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET statutory-contributions/:id — get" "200" "$s" "$b"

  # 7.6 Filter by side
  r=$(get "$API/countries/$COUNTRY_CODE/statutory-contributions?contribution_side=EMPLOYEE")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET statutory-contributions?contribution_side=EMPLOYEE — filter" "200" "$s" "$b"

  # 7.7 Update
  r=$(patch "$API/countries/$COUNTRY_CODE/statutory-contributions/$CONTRIBUTION_ID" '{"ratePercentage":10.0}')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "PATCH statutory-contributions/:id — update" "200" "$s" "$b"
fi

# ============================================================
section "8. Deduction Section Management"

if [[ -z "$REGIME_ID" ]]; then
  skip "Deduction Section tests" "no regime ID"
else
  # 8.1 Create regime-specific deduction
  r=$(post "$API/countries/$COUNTRY_CODE/deduction-sections" "{
    \"regimeId\": \"$REGIME_ID\",
    \"code\": \"SEC_A\",
    \"sectionName\": \"Section A Deduction\",
    \"description\": \"Test deduction section\",
    \"maxLimit\": 100000,
    \"isApplicableAllRegimes\": false,
    \"displayOrder\": 1,
    \"effectiveFrom\": \"2025-01-01\",
    \"effectiveTo\": null
  }")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST deduction-sections — regime-specific" "201" "$s" "$b"
  DEDUCTION_ID=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

  # 8.2 Create all-regimes deduction
  r=$(post "$API/countries/$COUNTRY_CODE/deduction-sections" '{
    "code": "SEC_B",
    "sectionName": "Section B Deduction (All Regimes)",
    "maxLimit": 50000,
    "isApplicableAllRegimes": true,
    "displayOrder": 2,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null
  }')
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "POST deduction-sections — all regimes" "201" "$s" "$b"

  # 8.3 List
  r=$(get "$API/countries/$COUNTRY_CODE/deduction-sections")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET deduction-sections — list" "200" "$s" "$b"

  # 8.4 Filter by regime
  r=$(get "$API/countries/$COUNTRY_CODE/deduction-sections?regime_id=$REGIME_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "GET deduction-sections?regime_id — filter" "200" "$s" "$b"

  if [[ -n "$DEDUCTION_ID" ]]; then
    # 8.5 Get by ID
    r=$(get "$API/countries/$COUNTRY_CODE/deduction-sections/$DEDUCTION_ID")
    s=$(split_status "$r"); b=$(split_body "$r")
    assert_status "GET deduction-sections/:id — get" "200" "$s" "$b"

    # 8.6 Update
    r=$(patch "$API/countries/$COUNTRY_CODE/deduction-sections/$DEDUCTION_ID" '{"maxLimit":120000}')
    s=$(split_status "$r"); b=$(split_body "$r")
    assert_status "PATCH deduction-sections/:id — update" "200" "$s" "$b"
  fi
fi

# ============================================================
section "9. Calculation API"

# 9.1 Attempt calculation with test country (may hit NO_ACTIVE_RULES if
#     salary components / tax slabs are insufficient — still validates routing)
r=$(post "$API/calculate/payroll" "{
  \"countryCode\": \"$COUNTRY_CODE\",
  \"annualCtc\": 800000,
  \"taxRegimeCode\": \"STANDARD\",
  \"isMetro\": false,
  \"employeeAge\": 30,
  \"effectiveDate\": \"2025-06-01\"
}")
s=$(split_status "$r"); b=$(split_body "$r")
if [[ "$s" == "200" ]]; then
  pass "POST /calculate/payroll — TS country → 200 (full breakdown)"
elif [[ "$s" == "422" ]]; then
  pass "POST /calculate/payroll — TS country → 422 NO_ACTIVE_RULES (expected: no seeded rules)"
elif [[ "$s" == "400" ]]; then
  pass "POST /calculate/payroll — TS country → 400 (validation, acceptable before seed)"
else
  fail "POST /calculate/payroll — TS country → unexpected $s" "$b"
fi

# 9.2 Validation — missing countryCode → 400
r=$(post "$API/calculate/payroll" '{"annualCtc":500000,"taxRegimeCode":"STANDARD"}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /calculate/payroll — missing countryCode → 400" "400" "$s" "$b"

# 9.3 Validation — invalid CTC → 400
r=$(post "$API/calculate/payroll" '{"countryCode":"TS","annualCtc":-1,"taxRegimeCode":"STANDARD"}')
s=$(split_status "$r"); b=$(split_body "$r")
if [[ "$s" == "400" ]]; then
  pass "POST /calculate/payroll — negative CTC → 400"
else
  fail "POST /calculate/payroll — negative CTC → expected 400, got $s" "$b"
fi

# 9.4 Unknown country → 404
r=$(post "$API/calculate/payroll" '{"countryCode":"ZZ","annualCtc":500000,"taxRegimeCode":"STANDARD"}')
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "POST /calculate/payroll — unknown country → 404" "404" "$s" "$b"

# 9.5 Zero CTC → 400
r=$(post "$API/calculate/payroll" '{"countryCode":"TS","annualCtc":0,"taxRegimeCode":"STANDARD"}')
s=$(split_status "$r"); b=$(split_body "$r")
if [[ "$s" == "400" ]]; then
  pass "POST /calculate/payroll — zero CTC → 400"
else
  fail "POST /calculate/payroll — zero CTC → expected 400, got $s" "$b"
fi

# 9.6 India calculation (if seeded)
r=$(post "$API/calculate/payroll" '{
  "countryCode": "IN",
  "annualCtc": 1200000,
  "taxRegimeCode": "NEW_REGIME",
  "isMetro": true,
  "employeeAge": 30,
  "claimedDeductions": {},
  "effectiveDate": "2025-04-01",
  "outputCurrency": "USD"
}')
s=$(split_status "$r"); b=$(split_body "$r")
if [[ "$s" == "200" ]]; then
  pass "POST /calculate/payroll — IN seeded data → 200 with full breakdown"

  # Validate response shape
  has_salary=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'salaryBreakdown' in d.get('data',{}) else 'missing')" 2>/dev/null)
  has_tax=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'taxCalculation' in d.get('data',{}) else 'missing')" 2>/dev/null)
  has_net=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'netSalary' in d.get('data',{}) else 'missing')" 2>/dev/null)
  has_currency=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'currency' in d.get('data',{}) else 'missing')" 2>/dev/null)

  [[ "$has_salary" == "ok" ]] && pass "  response.data.salaryBreakdown present" || fail "  salary_breakdown missing" "$b"
  [[ "$has_tax" == "ok" ]] && pass "  response.data.taxCalculation present" || fail "  tax_calculation missing" "$b"
  [[ "$has_net" == "ok" ]] && pass "  response.data.netSalary present" || fail "  net_salary missing" "$b"
  [[ "$has_currency" == "ok" ]] && pass "  response.data.currency (USD conversion) present" || fail "  currency conversion missing" "$b"

elif [[ "$s" == "422" ]]; then
  skip "POST /calculate/payroll — IN calculation" "India data not seeded (run npm run seed:run)"
elif [[ "$s" == "404" ]]; then
  skip "POST /calculate/payroll — IN calculation" "India country not in DB (run npm run seed:run)"
else
  fail "POST /calculate/payroll — IN → unexpected $s" "$b"
fi

# 9.7 Unsupported output_currency → 400
r=$(post "$API/calculate/payroll" '{
  "countryCode": "IN",
  "annualCtc": 1200000,
  "taxRegimeCode": "NEW_REGIME",
  "effectiveDate": "2025-04-01",
  "outputCurrency": "XYZABC"
}')
s=$(split_status "$r"); b=$(split_body "$r")
if [[ "$s" == "400" || "$s" == "404" || "$s" == "422" ]]; then
  pass "POST /calculate/payroll — unsupported currency → $s (error response)"
else
  fail "POST /calculate/payroll — unsupported currency → expected 4xx, got $s" "$b"
fi

# ============================================================
section "10. Soft Delete Flows"

# 10.1 Delete deduction section
if [[ -n "$DEDUCTION_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/deduction-sections/$DEDUCTION_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE deduction-sections/:id — soft delete" "200" "$s" "$b"
fi

# 10.2 Delete cess
if [[ -n "$CESS_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-cess/$CESS_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE tax-cess/:id — soft delete" "200" "$s" "$b"
fi

# 10.3 Delete surcharge
if [[ -n "$SURCHARGE_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-surcharges/$SURCHARGE_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE tax-surcharges/:id — soft delete" "200" "$s" "$b"
fi

# 10.4 Delete slab
if [[ -n "$SLAB_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID/tax-slabs/$SLAB_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE tax-slabs/:id — soft delete" "200" "$s" "$b"
fi

# 10.5 Delete salary component
if [[ -n "$COMPONENT_CODE" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/salary-components/$COMPONENT_CODE")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE salary-components/:code — soft delete" "200" "$s" "$b"
fi

# 10.6 Delete statutory contribution
if [[ -n "$CONTRIBUTION_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/statutory-contributions/$CONTRIBUTION_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE statutory-contributions/:id — soft delete" "200" "$s" "$b"
fi

# 10.7 Delete tax regime
if [[ -n "$REGIME_ID" ]]; then
  r=$(delete "$API/countries/$COUNTRY_CODE/tax-regimes/$REGIME_ID")
  s=$(split_status "$r"); b=$(split_body "$r")
  assert_status "DELETE tax-regimes/:id — soft delete" "200" "$s" "$b"
fi

# 10.8 Delete country (last — after all children)
r=$(delete "$API/countries/$COUNTRY_CODE")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "DELETE /countries/$COUNTRY_CODE — soft delete" "200" "$s" "$b"

# 10.9 Deleted country should not appear in default list (is_active=true)
r=$(get "$API/countries?is_active=true")
s=$(split_status "$r"); b=$(split_body "$r")
found=$(echo "$b" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data',[])
codes=[i.get('code') for i in items]
print('found' if 'TS' in codes else 'gone')
" 2>/dev/null)
if [[ "$found" == "gone" ]]; then
  pass "Soft-deleted country TS absent from is_active=true list"
else
  fail "Soft-deleted country TS still visible in is_active=true list" "$b"
fi

# ============================================================
section "11. Pagination"

r=$(get "$API/countries?page=1&limit=5")
s=$(split_status "$r"); b=$(split_body "$r")
assert_status "GET /countries?page=1&limit=5 — paginated response" "200" "$s" "$b"

has_meta=$(echo "$b" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'meta' in d else 'missing')" 2>/dev/null)
[[ "$has_meta" == "ok" ]] && pass "  response.meta present" || fail "  response.meta missing" "$b"

# ============================================================
# Summary
echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL + SKIP))
echo -e "${BOLD}  Results: ${GREEN}$PASS passed${NC}  ${RED}$FAIL failed${NC}  ${YELLOW}$SKIP skipped${NC}  / $TOTAL total${NC}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0
