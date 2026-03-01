const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const firstProduct = cart.items[0].product;

    if (!firstProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const vendorId = firstProduct.vendor;

    for (let item of cart.items) {
      if (!item.product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (item.product.vendor.toString() !== vendorId.toString()) {
        return res.status(400).json({
          message: "All products must belong to same vendor",
        });
      }
    }

    const totalAmount = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      vendor: vendorId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount,
      status: "pending"
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Order failed" });
  }
};

exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      vendor: req.user._id,
    })
      .populate("user", "name email")
      .populate("items.product");

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVendorOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};