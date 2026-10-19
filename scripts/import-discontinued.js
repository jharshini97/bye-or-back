import { readFile } from "node:fs/promises";
import {
  connectToDatabase,
  closeDatabaseConnection,
} from "../db/connection.js";

// Loads the USDA products once, into an empty collection
try {
  const products = JSON.parse(
    await readFile(
      new URL("../data/discontinued-products.json", import.meta.url),
      "utf8",
    ),
  );
  const db = await connectToDatabase();
  const collection = db.collection("discontinuedProducts");

  if ((await collection.countDocuments()) > 0) {
    console.log("discontinuedProducts already has data, nothing imported");
  } else {
    const result = await collection.insertMany(
      products.map((product) => ({
        ...product,
        notes: "",
        source: "USDA FoodData Central",
      })),
    );
    console.log("Products inserted:", result.insertedCount);
  }
} catch (error) {
  console.error("Import error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
