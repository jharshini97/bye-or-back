
import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  connectToDatabase,
  closeDatabaseConnection
} from "../db/connection.js";

const outputPath = path.resolve(
  import.meta.dirname,
  "../docs/seasonal-categories.json"
);

async function analyzeCategories() {
  const db = await connectToDatabase();

  const products = await db
    .collection("seasonalProducts")
    .find({}, { projection: { category: 1, _id: 0 } })
    .toArray();

  const categoryCounts = new Map();

  for (const product of products) {
    const category =
      typeof product.category === "string"
        ? product.category.trim() || "Uncategorized"
        : "Uncategorized";

    const count = categoryCounts.get(category) ?? 0;

    categoryCounts.set(category, count + 1);
  }

  const categories = [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const report = {
    totalProducts: products.length,
    totalCategories: categories.length,
    categories
  };

  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("Total products:", report.totalProducts);
  console.log("Unique categories:", report.totalCategories);
  console.table(categories);
  console.log("Report saved to:", outputPath);
}

try {
  await analyzeCategories();
} catch (error) {
  console.error("Analysis error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
