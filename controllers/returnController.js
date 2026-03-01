const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");

exports.createReturn = async (req, res) => {
  const { orderId, productId, type, reason } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    const item = order.items.find(
      (i) => i.product.toString() === productId
    );

    if (!item)
      return res.status(404).json({
        message: "Product not in order",
      });

    const existing = await ReturnRequest.findOne({
      order: orderId,
      product: productId,
    });

    if (existing)
      return res.status(400).json({
        message: "Return already requested",
      });

    const newReturn = await ReturnRequest.create({
      user: req.user._id,
      order: orderId,
      product: productId,
      productName: item.name,
      image: item.image,
      type,
      reason,
    });

    res.status(201).json(newReturn);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getReturnForProduct = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);

    const item = order.items.find(
      (i) => i.product.toString() === productId
    );

    const returnRequest = await ReturnRequest.findOne({
      order: orderId,
      product: productId,
    });

    res.json({
      orderItem: item,
      returnRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getVendorReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find().sort({
      createdAt: -1,
    });

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateReturnStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const returnRequest = await ReturnRequest.findById(
      req.params.id
    );

    if (!returnRequest)
      return res.status(404).json({
        message: "Return not found",
      });

    returnRequest.status = status;
    await returnRequest.save();

    res.json(returnRequest);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};