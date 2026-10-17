
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";

const dataDirectory = path.resolve(
  import.meta.dirname,
  "../../usda-data"
);

const inputPath = path.join(dataDirectory, "food.csv");
const outputPath = path.join(
  dataDirectory,
  "seasonal-candidates.json"
);
const seasonalKeywords = {
  Spring: ["easter", "spring edition"],
  Summer: ["summer edition", "summer flavor", "watermelon"],
  Fall: ["pumpkin spice", "halloween"],
  Winter: ["peppermint", "gingerbread", "eggnog", "christmas"],
};


async function findCandidates(limitPerSeason = 25) {
  const stream = createReadStream(inputPath, {
    encoding: "utf8",
  });

  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  const candidates = [];
  const counts = Object.fromEntries(
    Object.keys(seasonalKeywords).map((season) => [season, 0])
  );

  try {
    for await (const line of lines) {
      const match = line.match(
        /^"(\d+)","branded_food","((?:[^"]|"")*)"/
      );

      if (!match) {
        continue;
      }

      const fdcId = Number(match[1]);
      const name = match[2].replaceAll('""', '"');
      const normalizedName = name.toLowerCase();

      for (const [season, keywords] of Object.entries(seasonalKeywords)) {
        if (counts[season] >= limitPerSeason) {
          continue;
        }

        const keyword = keywords.find((word) =>
          normalizedName.includes(word)
        );

        if (keyword) {
          candidates.push({
            fdcId,
            name,
            candidateSeason: season,
            matchedKeyword: keyword,
          });

          counts[season]++;
          break;
        }
      }

      const allSeasonsComplete = Object.values(counts).every(
        (count) => count >= limitPerSeason
      );

      if (allSeasonsComplete) {
        break;
      }
    }
  } finally {
    lines.close();
    stream.destroy();
  }

  console.log("Candidates by season:", counts);

  return candidates;
}


try {
  const candidates = await findCandidates();

  await writeFile(
    outputPath,
    JSON.stringify(candidates, null, 2),
    "utf8"
  );

  console.log(`Found ${candidates.length} candidates.`);
  console.table(candidates.slice(0, 5));
  console.log(`Saved to: ${outputPath}`);
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
}


