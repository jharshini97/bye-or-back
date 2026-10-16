
import { Router } from "express";
import { getDatabase } from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = getDatabase();
    const products = await db
      .collection("seasonalProducts")
      .find({})
      .toArray();

    res.json(products);
  } catch (error) {
    console.error("Error retrieving seasonal products:", error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
});

export default router;
