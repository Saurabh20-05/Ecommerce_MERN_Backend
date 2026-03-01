const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post(
  "/",
  protect,
  authorize("vendor"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, description, price, stock } = req.body;

      const product = await Product.create({
        name,
        description,
        price,
        stock,
        image: req.file ? `/uploads/${req.file.filename}` : "",
        vendor: req.user._id,
      });

      res.status(201).json(product);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  const products = await Product.find()
    .populate("vendor", "name");

  res.json(products);
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/:id",
  protect,
  authorize("vendor"),
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.stock = req.body.stock || product.stock;

      if (req.file) {
        product.image = `/uploads/${req.file.filename}`;
      }

      await product.save();

      res.json(product);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/:id",
  protect,
  authorize("vendor", "admin"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (
        req.user.role === "vendor" &&
        product.vendor.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await product.deleteOne();

      res.json({ message: "Product deleted successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;