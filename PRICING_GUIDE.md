# Amori Furniture — Pricing Computation Reference

Internal reference document for the Amori Furniture Price Calculator.  
Source: Amori Furniture Pricing Computation Guide v1.0 (Confidential)

---

## Core Pricing Philosophy

Every selling price must cover four cost layers before any profit is applied:

| Layer | What it covers |
|---|---|
| Materials + Wastage | Raw materials consumed, including trim/defect buffer |
| Labor | Carpenter/welder hours at skill-based hourly rates |
| Overhead | Hidden business costs (utilities, tools, transport, marketing) |
| Contingency | Emergency buffer for rework, measurement errors, price changes |

---

## Formulas

### 1. Material Cost

```
Price per cm²     = Full Sheet Price ÷ Full Sheet Area (cm²)
Material Cost     = Price per cm² × Product Area (cm²)
Wastage Allowance = Material Cost × Wastage %
Total Material Cost = Material Cost + Wastage Allowance
```

**Wastage rate:** 5–10% (default 8%). Never goes below 5% or above 10%.

**Example — Plywood:**
- Full sheet price: ₱2,320 | Size: 122cm × 244cm → Area: 29,768 cm²
- Price per cm²: ₱2,320 ÷ 29,768 = ₱0.07793/cm²
- Tabletop 180cm × 90cm → Area: 16,200 cm²
- Material cost used: 16,200 × ₱0.07793 = ₱1,262.47

---

### 2. Labor Cost

```
Hourly Rate     = Daily Rate ÷ 8
Total Labor Cost = Hourly Rate × Total Working Hours

// Multiple workers:
Total Hourly Rate = Worker1 Rate + Worker2 Rate + ...
Total Labor Cost  = Total Hourly Rate × Total Working Hours
```

**Current rates:**
- Skilled Carpenter: ₱87.50/hr
- Welder: ₱87.50/hr

Labor rate may be adjusted upward for complex or bespoke designs.

---

### 3. Overhead Cost

```
Overhead Cost = (Materials Total + Labor Cost) × Overhead %
```

**Overhead rate:** 10–15% (default 10%).

Categories covered: electricity, tool wear/maintenance, transportation, design/CAD time, marketing, workshop rental.

---

### 4. Contingency Cost

```
Contingency Cost = (Materials + Labor + Overhead) × Contingency %
```

**Contingency rate:** 8% (standard).

Covers: measurement mistakes, material defects, rework, supplier price changes, hardware shortfalls, delivery delays.

---

### 5. Total Product Cost

```
Total Product Cost = Materials Total + Labor + Overhead + Contingency
```

---

### 6. Selling Price (Margin-Based)

```
Selling Price   = Total Product Cost ÷ (1 - Target Margin)
Profit          = Selling Price - Total Product Cost
Profit Margin % = Profit ÷ Selling Price × 100
```

> **Important:** Selling price uses a margin-based divisor — NOT a simple markup on cost.  
> Profit margin is always computed against Selling Price, never against Product Cost.

---

## Margin Reference Table

| Target Margin | Divisor | Use Case |
|---|---|---|
| 30% | ÷ 0.70 | Promo / Entry-level offers |
| 40% | ÷ 0.60 | Regular / Balanced pricing |
| 45% | ÷ 0.55 | Premium positioning |
| 50% | ÷ 0.50 | Executive / Custom / Bespoke |

**Recommended sweet spot for Amori Furniture: 40%–45%**

---

## Standard Price Points (based on sample product at ₱3,704.90 total cost)

| Label | Selling Price | Profit (₱) | Profit Margin | When to Use |
|---|---|---|---|---|
| Intro / Launch | ₱5,999 | ₱2,294.10 | 38.24% | New clients, launch promos |
| Regular | ₱6,499 | ₱2,794.10 | 42.99% | Standard orders |
| Premium | ₱6,999 | ₱3,294.10 | 47.07% | Rush, complex design, special materials |

---

## Default Rate Constants (for calculator implementation)

| Constant | Value | Notes |
|---|---|---|
| `WASTAGE_RATE` | 8% | Adjustable 5–10% |
| `OVERHEAD_RATE` | 10% | Adjustable 10–15% |
| `CONTINGENCY_RATE` | 8% | Standard |
| `SKILLED_HOURLY_RATE` | ₱87.50 | Carpenter & Welder |
| `WORKING_HOURS_PER_DAY` | 8 | For daily-to-hourly conversion |
| `PLYWOOD_SHEET_WIDTH` | 122 cm | Standard sheet |
| `PLYWOOD_SHEET_HEIGHT` | 244 cm | Standard sheet |

---

## Quick Cheat Sheet

| Formula | Expression |
|---|---|
| Wastage Allowance | `Material Cost × Wastage %` |
| Total Material Cost | `Material Cost + Wastage Allowance` |
| Overhead Cost | `(Materials + Labor) × Overhead %` |
| Contingency Cost | `(Materials + Labor + Overhead) × Contingency %` |
| Total Product Cost | `Materials + Labor + Overhead + Contingency` |
| Selling Price | `Total Product Cost ÷ (1 - Target Margin)` |
| Profit | `Selling Price - Total Product Cost` |
| Profit Margin % | `Profit ÷ Selling Price × 100` |

---

*Amori Furniture — Premium Italian-Inspired Custom Furniture*  
*Confidential | Internal Use Only | v1.0*
