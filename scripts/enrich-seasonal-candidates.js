
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";

const dataDirectory = path.resolve(
  import.meta.dirname,
  "../../usda-data"
);

// Read complete CSV records, including quoted multiline fields.
async function* readCsvRecords(filePath) {
  const stream = createReadStream(filePath, {
    encoding: "utf8",
  });

  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let parts = [];
  let insideQuotes = false;

  try {
    for await (const line of lines) {
      parts.push(line);

      for (const character of line) {
        if (character === '"') {
          insideQuotes = !insideQuotes;
        }
      }

      if (!insideQuotes) {
        yield parts.join("\n");
        parts = [];
      }
    }

    if (parts.length > 0) {
      throw new Error("Incomplete CSV record");
    }
  } finally {
    lines.close();
    stream.destroy();
  }
}

// Separate CSV fields without splitting commas inside quotes.
function parseCsvRecord(record) {
  const columns = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < record.length; i++) {
    const character = record[i];

    if (character === '"' && insideQuotes && record[i + 1] === '"') {
      value += '"';
      i++;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      columns.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  columns.push(value);
  return columns;
}

async function enrichCandidates() {
  const candidatesPath = path.join(
    dataDirectory,
    "seasonal-candidates.json"
  );

  const brandedPath = path.join(
    dataDirectory,
    "branded_food.csv"
  );

  const outputPath = path.join(
    dataDirectory,
    "seasonal-enriched.json"
  );

  const candidates = JSON.parse(
    await readFile(candidatesPath, "utf8")
  );

  // Quickly identify which USDA IDs we need.
  const candidatesById = new Map(
    candidates.map((product) => [String(product.fdcId), product])
  );

  const enriched = [];

  for await (const record of readCsvRecords(brandedPath)) {
    const match = record.match(/^"(\d+)",/);

    if (!match || !candidatesById.has(match[1])) {
      continue;
    }

    const columns = parseCsvRecord(record);
    const candidate = candidatesById.get(match[1]);

    enriched.push({
      ...candidate,
      brand: columns[2]?.trim() || columns[1]?.trim() || "",
      category: columns[10]?.trim() || "",
      gtinUpc: columns[4]?.trim() || "",
      discontinuedDate: columns[16]?.trim() || null,
      source: "USDA FoodData Central",
    });

    if (enriched.length === candidatesById.size) {
      break;
    }
  }

  await writeFile(
    outputPath,
    JSON.stringify(enriched, null, 2),
    "utf8"
  );

  console.log(`Original candidates: ${candidates.length}`);
  console.log(`Matched products: ${enriched.length}`);

  console.table(
    enriched.slice(0, 5).map(({ fdcId, brand, category, gtinUpc }) => ({
      fdcId,
      brand,
      category,
      gtinUpc,
    }))
  );

  console.log(`Saved to: ${outputPath}`);
}

try {
  await enrichCandidates();
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
}
