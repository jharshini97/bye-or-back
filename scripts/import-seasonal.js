
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  connectToDatabase,
  closeDatabaseConnection
} from "../db/connection.js";

const dataDirectory = path.resolve(
  import.meta.dirname,
  "../../usda-data"
);

const inputPath = path.join(
  dataDirectory,
  "seasonal-enriched.json"
);

const monthsBySeason = {
  Spring: [3, 4, 5],
  Summer: [6, 7, 8],
  Fall: [9, 10, 11],
  Winter: [12, 1, 2]
};

const importLimit = 100;

async function importProducts() {
  const candidates = JSON.parse(
    await readFile(inputPath, "utf8")
  );

  const selectedProducts = candidates.slice(0, importLimit);

  const db = await connectToDatabase();
  const collection = db.collection("seasonalProducts");

  let inserted = 0;
  let skipped = 0;

  for (const candidate of selectedProducts) {
    const months = monthsBySeason[candidate.candidateSeason];

    if (!months || !Number.isInteger(candidate.fdcId)) {
      throw new Error(
        `Invalid product data: ${candidate.fdcId}`
      );
    }

    const now = new Date();

    const product = {
      fdcId: candidate.fdcId,
      name: candidate.name,
      brand: candidate.brand,
      category: candidate.category || "Uncategorized",

      season: candidate.candidateSeason,
      availableMonths: [...months],
      seasonStatus: "estimated",

      notes: "",
      source: "USDA FoodData Central",

      createdAt: now,
      createdBy: null,
      updatedAt: now,
      lastEditedBy: null,
      lastEditedAt: null
    };

    const result = await collection.updateOne(
      { fdcId: product.fdcId },
      { $setOnInsert: product },
      { upsert: true }
    );

    if (result.upsertedCount === 1) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log("Products selected:", selectedProducts.length);
  console.log("Products inserted:", inserted);
  console.log("Existing products skipped:", skipped);
}

try {
  await importProducts();
} catch (error) {
  console.error("Import error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
