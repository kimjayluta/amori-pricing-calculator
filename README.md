# Amori Pricing Calculator

An internal pricing tool for Amori Furniture. Calculate material costs, overhead, contingency, and target margins — then generate a suggested selling price for every product.

---

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Configure the database URL

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./prisma/pricing.db"
```

### Run the database migration

```bash
npx prisma migrate dev
```

This creates `prisma/pricing.db` and applies the schema.

### Seed sample data (optional)

```bash
npx prisma db seed
```

Seeds 3 sample products with pricing versions and library materials.

### Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production build

```bash
npm run build
npm start
```

---

## Folder structure

```
amori-pricing-calculator/
├── prisma/
│   ├── schema.prisma          # 4 models: Product, PricingVersion, Material, MaterialLibrary
│   ├── seed.mts               # Sample data seeder
│   ├── migrations/            # SQL migration history
│   └── pricing.db             # SQLite database (created after migration)
│
├── prisma.config.ts           # Prisma v7 config — DB URL + seed command
│
├── src/
│   ├── actions/               # Next.js Server Actions (all DB mutations live here)
│   │   ├── dashboard.ts       # Aggregate stats for the dashboard
│   │   ├── products.ts        # Product CRUD + duplicate + archive
│   │   ├── pricing.ts         # PricingVersion CRUD + duplicate
│   │   ├── materials.ts       # Material (per-version) CRUD
│   │   └── material-library.ts# MaterialLibrary CRUD
│   │
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── layout.tsx         # Root layout — sidebar, theme, toaster
│   │   ├── globals.css        # Tailwind v4 theme + print styles
│   │   ├── products/          # /products, /products/new, /products/[id]/edit
│   │   ├── pricing/
│   │   │   └── [productId]/
│   │   │       ├── page.tsx              # Pricing history list
│   │   │       └── [versionId]/
│   │   │           ├── page.tsx          # Pricing calculator (new or edit)
│   │   │           └── details/page.tsx  # Read-only version detail + print/export
│   │   ├── material-library/  # Material library browser + editor
│   │   └── settings/          # App settings (defaults, theme, currency)
│   │
│   ├── components/
│   │   ├── ui/                # Shared UI primitives (shadcn/base-ui)
│   │   │   └── margin-badge.tsx  # Reusable color-coded margin pill
│   │   ├── products/          # ProductForm, ProductsTable
│   │   ├── pricing/           # PricingCalculator, VersionsTable, VersionDetail
│   │   ├── library/           # MaterialLibraryClient
│   │   ├── sidebar.tsx
│   │   └── theme-provider.tsx
│   │
│   ├── lib/
│   │   ├── pricing-engine.ts  # Pure math: wastage, overhead, margin, profit
│   │   ├── prisma.ts          # Prisma singleton with BetterSQLite3 adapter
│   │   └── utils.ts           # cn(), formatPeso(), formatPercent()
│   │
│   └── generated/prisma/      # Auto-generated Prisma client (do not edit)
│
└── .env                       # DATABASE_URL (not committed)
```

---

## Key concepts

### Pricing engine

All cost math lives in `src/lib/pricing-engine.ts` and is pure (no side effects):

| Function | Formula |
|---|---|
| Wastage cost | `price × qty × (wastage% ÷ 100)` |
| Total material cost | `price × qty + wastage` |
| Overhead | `(materials + labor) × overhead%` |
| Contingency | `(materials + labor + overhead) × contingency%` |
| Total product cost | `materials + labor + overhead + contingency` |
| Suggested selling price | `total ÷ (1 − margin%)` |
| Actual margin | `profit ÷ selling price × 100` |

### Margin thresholds

| Status | Range |
|---|---|
| Danger | < 30% |
| Warning | 30–39% |
| Good | 40–45% |
| Great | 46–50% |
| Excellent | > 50% |

### Settings defaults

Default overhead, contingency, and target margin are stored in `localStorage` under these keys:

```
amori:overhead_pct      (default 15)
amori:contingency_pct   (default 10)
amori:target_margin     (default 35)
```

These pre-fill **new** pricing versions only. Existing versions are never modified.

---

## Backing up your data

All data lives in a single SQLite file:

```
prisma/pricing.db
```

**To back up:** copy this file to a safe location.

```bash
cp prisma/pricing.db ~/Desktop/pricing-backup-$(date +%Y%m%d).db
```

**To restore:** stop the app, replace the file, then restart.

```bash
# Stop the server first, then:
cp ~/Desktop/pricing-backup-20260628.db prisma/pricing.db
npm run dev
```

**To reset to a clean slate:**

```bash
npx prisma migrate reset   # drops and re-creates the DB, then re-seeds
```

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (Base UI) |
| Styling | Tailwind CSS v4 |
| Database | SQLite via Prisma v7 + better-sqlite3 |
| Themes | next-themes |
| Toasts | Sonner |
| Excel export | xlsx |
| Icons | Lucide React |
