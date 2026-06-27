-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "dimensions" TEXT,
    "image_url" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pricing_versions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "version_name" TEXT NOT NULL,
    "labor_cost" REAL NOT NULL,
    "overhead_percentage" REAL NOT NULL,
    "overhead_cost" REAL NOT NULL,
    "contingency_percentage" REAL NOT NULL,
    "contingency_cost" REAL NOT NULL,
    "target_margin" REAL NOT NULL,
    "materials_total" REAL NOT NULL,
    "total_product_cost" REAL NOT NULL,
    "suggested_selling_price" REAL NOT NULL,
    "final_selling_price" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "actual_margin" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "materials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pricing_version_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "costing_price" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "wastage_percentage" REAL NOT NULL,
    "wastage_cost" REAL NOT NULL,
    "total_cost" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "materials_pricing_version_id_fkey" FOREIGN KEY ("pricing_version_id") REFERENCES "pricing_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "material_library" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_price" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "updated_at" DATETIME NOT NULL
);
