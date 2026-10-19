
import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  connectToDatabase,
  closeDatabaseConnection
} from "../db/connection.js";

import { categoryGroups } from "./category-groups.js";

async function previewCategories() {
  const db = await connectToDatabase();

  const products = await db
    .collection("seasonalProducts")
    .find({})
    .toArray();

  // Create a lookup from original to general category.
  const categoryMap = new Map();

  for (const [generalCategory, originalCategories]
    of Object.entries(categoryGroups)) {
    for (const original of originalCategories) {
      categoryMap.set(original, generalCategory);
    }
  }

  const preview = products.map((product) => {
    const originalCategory =
      product.originalCategory ??
      (product.category === "Uncategorized"
        ? null
        : product.category);

    const lookupCategory = originalCategory ?? "Uncategorized";
    const newCategory = categoryMap.get(lookupCategory);

    return {
      fdcId: product.fdcId,
      name: product.name,
      originalCategory,
      category: newCategory ?? null
    };
  });

  const unmapped = preview.filter(
    (product) => product.category === null
  );

  const counts = new Map();

  for (const product of preview) {
    if (product.category === null) {
      continue;
    }

    counts.set(
      product.category,
      (counts.get(product.category) ?? 0) + 1
    );
  }

  const report = {
    totalProducts: preview.length,
    mappedProducts: preview.length - unmapped.length,
    unmappedProducts: unmapped.length,
    categories: Object.fromEntries(counts),
    products: preview
  };

  const outputPath = path.resolve(
    import.meta.dirname,
    "../docs/seasonal-category-preview.json"
  );

  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("Total products:", report.totalProducts);
  console.log("Mapped products:", report.mappedProducts);
  console.log("Unmapped products:", report.unmappedProducts);
  console.table([...counts].map(([category, count]) => ({
    category,
    count
  })));

  if (unmapped.length > 0) {
    console.log("Unmapped categories:");
    console.table(unmapped);
  }

  console.log("Preview saved to:", outputPath);
}

try {
  await previewCategories();
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
