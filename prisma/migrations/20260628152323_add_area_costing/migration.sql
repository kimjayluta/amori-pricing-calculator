-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_materials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pricing_version_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "costing_method" TEXT NOT NULL DEFAULT 'simple',
    "costing_price" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "wastage_percentage" REAL NOT NULL,
    "wastage_cost" REAL NOT NULL,
    "total_cost" REAL NOT NULL,
    "sheet_price" REAL,
    "sheet_width" REAL,
    "sheet_height" REAL,
    "usage_width" REAL,
    "usage_height" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "materials_pricing_version_id_fkey" FOREIGN KEY ("pricing_version_id") REFERENCES "pricing_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_materials" ("costing_price", "created_at", "id", "name", "pricing_version_id", "quantity", "total_cost", "unit_type", "wastage_cost", "wastage_percentage") SELECT "costing_price", "created_at", "id", "name", "pricing_version_id", "quantity", "total_cost", "unit_type", "wastage_cost", "wastage_percentage" FROM "materials";
DROP TABLE "materials";
ALTER TABLE "new_materials" RENAME TO "materials";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
