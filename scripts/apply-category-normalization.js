
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  connectToDatabase,
  closeDatabaseConnection
} from "../db/connection.js";

const previewPath = path.resolve(
  import.meta.dirname,
  "../docs/seasonal-category-preview.json"
);

async function applyNormalization() {
  const report = JSON.parse(
    await readFile(previewPath, "utf8")
  );

  // Do not proceed if the preview contains unmapped products.
  if (
    report.unmappedProducts !== 0 ||
    report.mappedProducts !== report.totalProducts ||
    report.products.length !== report.totalProducts
  ) {
    throw new Error("Category preview is incomplete");
  }

  const db = await connectToDatabase();
  const collection = db.collection("seasonalProducts");

  let updated = 0;
  let skipped = 0;

  for (const product of report.products) {
    // Match only products that still have their original category.
    const result = await collection.updateOne(
      {
        fdcId: product.fdcId,
        source: "USDA FoodData Central",
        category: product.originalCategory ?? "Uncategorized",
        originalCategory: { $exists: false }
      },
      {
        $set: {
          category: product.category,
          originalCategory: product.originalCategory,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log("Total products:", report.totalProducts);
  console.log("Updated products:", updated);
  console.log("Skipped products:", skipped);
}

try {
  await applyNormalization();
} catch (error) {
  console.error("Normalization error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
