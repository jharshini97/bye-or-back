import products from "../data/discontinued-products.json" with { type: "json" };
import {
  connectToDatabase,
  closeDatabaseConnection,
} from "../db/connection.js";

// Loads the USDA products once
try {
  const db = await connectToDatabase();
  const collection = db.collection("discontinuedProducts");

  // Jharshini: I like that the implementation prevents re-runs from duplicating data
  if (await collection.findOne({ source: "USDA FoodData Central" })) {
    console.log("USDA products already imported");
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
