const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String
    },
    stock: {
      type: Number,
      required: true
    },

    // 🔥 THIS IS IMPORTANT
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);