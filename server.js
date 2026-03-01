const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json());

const cors = require("cors");

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});