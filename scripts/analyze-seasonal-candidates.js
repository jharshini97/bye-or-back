
import { readFile } from "node:fs/promises";
import path from "node:path";

const dataDirectory = path.resolve(
  import.meta.dirname,
  "../../usda-data"
);

const filePath = path.join(
  dataDirectory,
  "seasonal-enriched.json"
);

const products = JSON.parse(
  await readFile(filePath, "utf8")
);

// Check for missing information.
const requiredFields = ["name", "brand", "category", "gtinUpc"];

console.log("Total records:", products.length);

for (const field of requiredFields) {
  const missing = products.filter(
    (product) => !product[field]
  ).length;

  console.log(`Missing ${field}: ${missing}`);
}

// Group products by UPC to detect duplicates.
const productsByUpc = new Map();

for (const product of products) {
  if (!product.gtinUpc) {
    continue;
  }

  const matches = productsByUpc.get(product.gtinUpc) ?? [];
  matches.push(product);
  productsByUpc.set(product.gtinUpc, matches);
}

const duplicates = [...productsByUpc.entries()].filter(
  ([, matches]) => matches.length > 1
);

const discontinued = products.filter(
  (product) => product.discontinuedDate
);

console.log("Unique UPCs:", productsByUpc.size);
console.log("Duplicate UPC groups:", duplicates.length);
console.log("Discontinued records:", discontinued.length);

console.table(
  duplicates.slice(0, 5).map(([upc, matches]) => ({
    upc,
    records: matches.length,
    fdcIds: matches.map((product) => product.fdcId).join(", "),
  }))
);
const missingCategories = products.filter(
  (product) => !product.category
);

console.log("\nProducts without category:");

console.table(
  missingCategories.map((product) => ({
    fdcId: product.fdcId,
    name: product.name,
    brand: product.brand,
    gtinUpc: product.gtinUpc,
  }))
);