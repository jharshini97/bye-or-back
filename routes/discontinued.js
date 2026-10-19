import express from "express";
import { ObjectId } from "mongodb";
import { myDB } from "../db/MyDBDiscontinued.js";

const router = express.Router();

// Keeps the editable fields, or returns null when the report is invalid
const readProduct = ({
  name,
  brand,
  category,
  discontinuedDate,
  notes,
} = {}) => {
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  const product = {
    name: text(name),
    brand: text(brand),
    category: text(category),
    discontinuedDate: text(discontinuedDate),
    notes: text(notes),
  };
  const validDate =
    !product.discontinuedDate ||
    /^\d{4}-\d{2}-\d{2}$/.test(product.discontinuedDate);
  return product.name && product.brand && validDate ? product : null;
};

// GET /api/discontinued?query=&page=1&pageSize=20
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize) || 20, 1),
    100,
  );
  // Escapes the search text so it matches literally in the name or the brand
  const text = String(req.query.query ?? "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const search = new RegExp(text, "i");
  const query = text ? { $or: [{ name: search }, { brand: search }] } : {};

  try {
    res.json(await myDB.getProducts({ query, page, pageSize }));
  } catch (error) {
    console.error("Error fetching discontinued products", error);
    res.status(500).json({ error: "Internal Server Error", products: [] });
  }
});

// POST /api/discontinued
router.post("/", async (req, res) => {
  const product = readProduct(req.body);
  if (!product) {
    return res
      .status(400)
      .json({ error: "Name and brand are required, dates as YYYY-MM-DD" });
  }

  try {
    const result = await myDB.createProduct({
      ...product,
      source: "Community",
    });
    res.status(201).json({ ok: true, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating discontinued product", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/discontinued/:id
router.put("/:id", async (req, res) => {
  const product = readProduct(req.body);
  if (!ObjectId.isValid(req.params.id) || !product) {
    return res.status(400).json({ error: "Invalid id or report" });
  }

  try {
    const result = await myDB.updateProduct(req.params.id, product);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Error updating discontinued product", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/discontinued/:id
router.delete("/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await myDB.deleteProduct(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting discontinued product", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
