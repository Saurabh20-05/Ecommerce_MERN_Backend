const express = require("express");
const Cart = require("../models/Cart");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    const updatedCart = await Cart.findOne({ user: req.user._id })
      .populate("items.product");

    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product");

  if (!cart) return res.json({ items: [] });

  res.json(cart);
});

router.put("/update", protect, async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart)
    return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item)
    return res.status(404).json({ message: "Item not found" });

  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
  } else {
    item.quantity = quantity;
  }

  await cart.save();

  const updatedCart = await Cart.findOne({ user: req.user._id })
    .populate("items.product");

  res.json(updatedCart);
});

router.delete("/remove/:productId", protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart)
    return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  await cart.save();

  const updatedCart = await Cart.findOne({ user: req.user._id })
    .populate("items.product");

  res.json(updatedCart);
});

module.exports = router;