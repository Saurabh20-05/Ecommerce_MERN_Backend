const express = require("express");
const Review = require("../models/Review");
const { protect, authorize } = require("../middleware/authMiddleware");

const { getVendorReviews } = require("../controllers/reviewController");

const router = express.Router();

router.get(
  "/vendor",
  protect,
  authorize("vendor"),
  getVendorReviews
);

router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });

    res.status(201).json(review);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:productId", async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId
  }).populate("user", "name");

  res.json(reviews);
});

module.exports = router;