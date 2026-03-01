const express = require("express");
const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", protect, async (req, res) => {
  try {
    const requests = await ReturnRequest.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get(
  "/admin/all",
  protect,
  authorize("admin", "vendor"),
  async (req, res) => {
    try {
      const requests = await ReturnRequest.find()
        .populate("user", "name email")
        .populate({
          path: "order",
          select: "createdAt items",
        })
        .sort({ createdAt: -1 });

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.post("/", protect, async (req, res) => {
  try {
    const { orderId, productId, type, reason } = req.body;

    if (!orderId || !productId || !type || !reason) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order)
      return res.status(404).json({
        message: "Order not found",
      });

    const item = order.items.find(
      (i) => i.product.toString() === productId
    );

    if (!item)
      return res.status(404).json({
        message: "Product not found in order",
      });

    const existing = await ReturnRequest.findOne({
      order: orderId,
      product: productId,
    });

    if (existing)
      return res.status(400).json({
        message: "Return already requested",
      });

    const request = await ReturnRequest.create({
      order: orderId,
      product: productId,
      user: req.user.id,
      productName: item.name,
      image: item.image,
      type,
      reason,
      status: "Pending",
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:orderId/:productId", protect, async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const order = await Order.findById(orderId);

    if (!order)
      return res.status(404).json({
        message: "Order not found",
      });

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
});

router.put(
  "/:id",
  protect,
  authorize("admin", "vendor"),
  async (req, res) => {
    try {
      const request = await ReturnRequest.findById(
        req.params.id
      );

      if (!request)
        return res.status(404).json({
          message: "Return not found",
        });

      request.status = req.body.status;
      request.adminComment = req.body.adminComment || "";

      await request.save();

      res.json(request);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;