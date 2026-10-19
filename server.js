import express from "express";
import { connectToDatabase } from "./db/connection.js";
import seasonalRouter from "./routes/seasonal.js";

const app = express();
const PORT = 3000;
app.use(express.json());
// Serve frontend files
app.use(express.static("public"));
app.use("/api/seasonal", seasonalRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Bye or Back!");
});

try {
  await connectToDatabase();
  console.log("Successfully connected to MongoDB!");

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
