
import {
  connectToDatabase,
  closeDatabaseConnection
} from "../db/connection.js";

try {
  const db = await connectToDatabase();

  const indexName = await db
    .collection("seasonalProducts")
    .createIndex(
      { fdcId: 1 },
      {
        name: "unique_usda_fdc_id",
        unique: true,
        partialFilterExpression: {
          fdcId: { $type: "number" }
        }
      }
    );

  console.log("Index created:", indexName);
} catch (error) {
  console.error("Index error:", error.message);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
