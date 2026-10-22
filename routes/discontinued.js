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
  editedBy,
} = {}) => {
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  const product = {
    name: text(name),
    brand: text(brand),
    category: text(category),
    discontinuedDate: text(discontinuedDate),
    notes: text(notes),
    lastEditedBy: text(editedBy),
  };
  // A real calendar date as YYYY-MM-DD, or no date
  const validDate =
    !product.discontinuedDate ||
    new Date(product.discontinuedDate).toJSON()?.slice(0, 10) ===
      product.discontinuedDate;
  // Jharshini: in public/discontinued.html the limits for name,brand, and categoru is set to lower values
  // anyone calling the API directly can store longer names than the form allpws
  const short = Object.values(product).every((value) => value.length <= 500); 
  return product.name &&
    product.brand &&
    product.lastEditedBy &&
    validDate &&
    short
    ? { ...product, lastEditedAt: new Date() }
    : null;
};

const INVALID_REPORT =
  "Name, brand and demo user are required, dates as YYYY-MM-DD, fields up to 500 characters";

// GET /api/discontinued?query=&page=1&pageSize=20
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize) || 20, 1),
    100,
  );
  // Escapes regex characters so the search is literal
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

router.post("/", async (req, res) => {
  const product = readProduct(req.body);
  if (!product) {
    return res.status(400).json({ error: INVALID_REPORT });
  }
  // Jharshini: a small suggestion. POST stores the reporter only in LastEditedBy
  // so the original reporter is lost after an edit
  // consider adding createdBy/createdAt
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

router.put("/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const product = readProduct(req.body);
  if (!product) {
    return res.status(400).json({ error: INVALID_REPORT });
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
