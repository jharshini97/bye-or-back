import products from "../data/seasonal-products.json" with { type: "json" };
import {
  connectToDatabase,
  closeDatabaseConnection,
} from "../db/connection.js";

try {
  const db = await connectToDatabase();
  const collection = db.collection("seasonalProducts");

  let inserted = 0;
  let skipped = 0;

  for (const product of products) {
    if (!Number.isInteger(product.fdcId)) {
      throw new Error(`Invalid product data: ${product.name}`);
    }

    const now = new Date();

    const document = {
      fdcId: product.fdcId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      originalCategory: product.originalCategory,
      season: product.season,
      availableMonths: [...product.availableMonths],
      seasonStatus: "estimated",
      notes: "",
      source: "USDA FoodData Central",
      createdAt: now,
      createdBy: null,
      updatedAt: now,
      lastEditedBy: null,
      lastEditedAt: null,
    };

    const result = await collection.updateOne(
      { fdcId: document.fdcId },
      { $setOnInsert: document },
      { upsert: true },
    );

    if (result.upsertedCount === 1) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log("Products selected:", products.length);
  console.log("Products inserted:", inserted);
  console.log("Existing products skipped:", skipped);
} catch (error) {
  console.error("Import error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
