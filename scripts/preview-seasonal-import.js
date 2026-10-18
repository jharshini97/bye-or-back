
import { readFile } from "node:fs/promises";
import path from "node:path";

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

const candidates = JSON.parse(
  await readFile(inputPath, "utf8")
);

const now = new Date();

const products = candidates.map((candidate) => {
  const months = monthsBySeason[candidate.candidateSeason];

  if (!months) {
    throw new Error(
      `Invalid season for product ${candidate.fdcId}`
    );
  }

  return {
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
});

console.log("Products ready for review:", products.length);
console.log("\nSample product:");
console.log(JSON.stringify(products[0], null, 2));
