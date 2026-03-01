const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const firstProduct = cart.items[0].product;

    if (!firstProduct?.vendor) {
      return res.status(400).json({ message: "Vendor missing in product" });
    }

    const vendorId = firstProduct.vendor.toString();

    for (let item of cart.items) {
      if (!item.product?.vendor) {
        return res.status(400).json({ message: "Vendor missing in product" });
      }

      if (item.product.vendor.toString() !== vendorId) {
        return res.status(400).json({
          message: "All products must belong to same vendor",
        });
      }
    }

    let totalAmount = 0;

    const items = cart.items.map(item => {
      totalAmount += item.product.price * item.quantity;

      console.log("PRODUCT IMAGE FROM CART:", item.product.image);

      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.image,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    const order = await Order.create({
      user: req.user._id,
      vendor: vendorId,
      items,
      totalAmount,
      status: "pending",
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: "Order failed" });
  }
});

router.get("/my", protect, authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/vendor", protect, authorize("vendor"), async (req, res) => {
  try {
    const orders = await Order.find({
      vendor: req.user._id,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/vendor/:id", protect, authorize("vendor"), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status || order.status;
    await order.save();

    res.json({
      message: "Order status updated",
      order,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;