const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

router.get(
  "/summary",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const customers = await User.countDocuments({ role: "customer" });
      const vendors = await User.countDocuments({ role: "vendor" });
      const products = await Product.countDocuments();

      res.json({ customers, vendors, products });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/vendors",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const vendors = await User.find({ role: "vendor" });

      const vendorsWithStats = await Promise.all(
        vendors.map(async (vendor) => {
          const totalProducts = await Product.countDocuments({
            vendor: vendor._id,
          });

          return {
            ...vendor._doc,
            totalProducts,
          };
        })
      );

      res.json(vendorsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/customers",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const customers = await User.find({ role: "customer" });

      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const totalOrders = await Order.countDocuments({
            user: customer._id,
          });

          return {
            ...customer._doc,
            totalOrders,
          };
        })
      );

      res.json(customersWithStats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete(
  "/remove-user/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;