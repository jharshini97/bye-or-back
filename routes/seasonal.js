import { Router } from "express";
import { getDatabase } from "../db/connection.js";
import { ObjectId } from "mongodb";
import { categoryGroups } from "../scripts/category-groups.js";
const router = Router();
//metodo GET
router.get("/", async (req, res) => {
  try {
    const db = getDatabase();
    const products = await db.collection("seasonalProducts").find({}).toArray();

    res.json(products);
  } catch (error) {
    console.error("Error retrieving seasonal products:", error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
});

// metodo POST

router.post("/", async (req, res) => {
  try {
    const { name, brand, category, season, availableMonths, notes } =
      req.body ?? {};

    // Validate required text fields
    const requiredFields = [name, brand, season];

    const selectedCategory = category == null ? "" : category;

    if (typeof selectedCategory !== "string") {
      return res.status(400).json({
        error: "Category must be a string",
      });
    }

    const finalCategory = selectedCategory.trim() || "Other / Uncategorized";

    if (!Object.hasOwn(categoryGroups, finalCategory)) {
      return res.status(400).json({
        error: "Invalid product category",
      });
    }

    if (
      !requiredFields.every(
        (value) => typeof value === "string" && value.trim() !== "",
      )
    ) {
      return res.status(400).json({
        error: "Name, brand and season are required",
      });
    }

    // Validate availability months
    if (
      !Array.isArray(availableMonths) ||
      availableMonths.length === 0 ||
      !availableMonths.every(
        (month) => Number.isInteger(month) && month >= 1 && month <= 12,
      )
    ) {
      return res.status(400).json({
        error: "Available months must be an array of numbers from 1 to 12",
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        error: "Notes must be a string",
      });
    }

    const now = new Date();

    const product = {
      name: name.trim(),
      brand: brand.trim(),
      category: finalCategory,
      season: season.trim(),
      availableMonths: [...new Set(availableMonths)],
      notes: notes?.trim() ?? "",

      // Seasonal classification
      seasonStatus: "estimated",

      // Original source
      source: "Community",

      // Creation information
      createdAt: now,
      createdBy: null,

      // Update information
      updatedAt: now,
      lastEditedBy: null,
      lastEditedAt: null,
    };

    const db = getDatabase();
    const result = await db.collection("seasonalProducts").insertOne(product);

    return res.status(201).json({
      message: "Seasonal product created successfully",
      product: {
        _id: result.insertedId,
        ...product,
      },
    });
  } catch (error) {
    console.error("Error creating seasonal product:", error);

    return res.status(500).json({
      error: "Failed to create seasonal product",
    });
  }
});

//modificar un producto existente con PUT

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    // Get updated product data

    const { name, brand, category, season, availableMonths, notes, editedBy } =
      req.body ?? {};

    // Validate required fields
    const requiredFields = [name, brand, season];

    if (
      !requiredFields.every(
        (value) => typeof value === "string" && value.trim() !== "",
      )
    ) {
      return res.status(400).json({
        error: "Name, brand, and season are required",
      });
    }

    const selectedCategory = category == null ? "" : category;

    if (typeof selectedCategory !== "string") {
      return res.status(400).json({
        error: "Category must be a string",
      });
    }

    const finalCategory = selectedCategory.trim() || "Other / Uncategorized";

    if (!Object.hasOwn(categoryGroups, finalCategory)) {
      return res.status(400).json({
        error: "Invalid product category",
      });
    }

    // Validate available months
    if (
      !Array.isArray(availableMonths) ||
      availableMonths.length === 0 ||
      !availableMonths.every(
        (month) => Number.isInteger(month) && month >= 1 && month <= 12,
      )
    ) {
      return res.status(400).json({
        error: "Available months must be an array of numbers from 1 to 12",
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        error: "Notes must be a string",
      });
    }

    if (typeof editedBy !== "string" || editedBy.trim() === "") {
      return res.status(400).json({
        error: "Editor name is required",
      });
    }

    // Prepare updated data
    const updatedData = {
      name: name.trim(),
      brand: brand.trim(),
      category: finalCategory,
      season: season.trim(),
      availableMonths: [...new Set(availableMonths)],
      notes: notes?.trim() ?? "",
      updatedAt: new Date(),
      lastEditedBy: editedBy.trim(),
      lastEditedAt: new Date(),
    };

    const db = getDatabase();
    const productId = new ObjectId(id);

    // Update product in MongoDB
    const result = await db
      .collection("seasonalProducts")
      .updateOne({ _id: productId }, { $set: updatedData });

    // Check whether the product exists
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Seasonal product not found",
      });
    }

    // Retrieve the updated product
    const product = await db.collection("seasonalProducts").findOne({
      _id: productId,
    });

    return res.status(200).json({
      message: "Seasonal product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating seasonal product:", error);

    return res.status(500).json({
      error: "Failed to update seasonal product",
    });
  }
});

//borrar

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    const db = getDatabase();
    const productId = new ObjectId(id);

    // Delete product from MongoDB
    const result = await db
      .collection("seasonalProducts")
      .deleteOne({ _id: productId });

    // Check whether the product existed
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Seasonal product not found",
      });
    }

    return res.status(200).json({
      message: "Seasonal product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seasonal product:", error);

    return res.status(500).json({
      error: "Failed to delete seasonal product",
    });
  }
});

export default router;
