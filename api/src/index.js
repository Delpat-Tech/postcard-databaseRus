const originalLog = console.log;
const originalError = console.error;
console.log = function (...args) {
  const timestamp = new Date().toISOString();
  originalLog(`[log ${timestamp}]`, ...args);
};

console.error = function (...args) {
  const timestamp = new Date().toISOString();
  originalError(`[error ${timestamp}]`, ...args);
}
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const chalk = require("chalk");
const authRoutes = require("./routes/auth");
const templateRoutes = require("./routes/templates");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const payRoutes = require("./routes/payment");
const uploadRoutes = require("./routes/uploads");
const app = express();
const PORT = process.env.PORT || 4000;
const morganMiddleware = morgan(function (tokens, req, res) {
  function statusColor() {
    const status = tokens.status(req, res);
    if (status >= 100 && status < 200) {
      return chalk.grey.bold(tokens.status(req, res));
    } else if (status >= 200 && status < 300) {
      return chalk.green.bold(tokens.status(req, res));
    } else if (status >= 300 && status < 400) {
      return chalk.red.bold(tokens.status(req, res));
    } else if (status >= 400 && status < 500) {
      return chalk.blue.bold(tokens.status(req, res));
    } else {
      // Default color for status codes outside the expected range
      return chalk.yellow.bold(tokens.status(req, res));
    }
  }

  return [
    chalk.hex("#34ace0").bold(tokens.method(req, res)),
    statusColor(),
    chalk.hex("#ff5252").bold(tokens.url(req, res)),
    chalk.hex("#2ed573").bold(tokens["response-time"](req, res) + " ms"),
    chalk.hex("#f78fb3").bold("@ " + tokens.date(req, res)),
    chalk.yellow(tokens["remote-addr"](req, res)),
    chalk.hex("#fffa65").bold("from " + tokens.referrer(req, res)),
    chalk.hex("#1e90ff")(tokens["user-agent"](req, res)),
    "\n",
  ].join(" ");
});

app.use(morganMiddleware);

// CORS: allow one or more frontend origins via FRONTEND_URL (comma-separated) or allow all with '*'
const rawFrontends = process.env.FRONTEND_URL || "*";
const allowedFrontends = rawFrontends.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., curl, mobile)
      if (!origin) return callback(null, true);
      if (allowedFrontends.includes("*") || allowedFrontends.includes(origin)) {
        return callback(null, true);
      }
      // not allowed
      return callback(new Error("Not allowed by CORS"));
    },
    // allow credentials if needed in future
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads folder exists and serve it statically at /uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.error("Failed to ensure uploads directory:", err?.message || err);
}
app.use("/uploads", express.static(uploadsDir));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", payRoutes);
app.use("/api/uploads", uploadRoutes);

// health
app.get("/health", (req, res) => res.json({ ok: true, time: new Date() }));

async function start() {
  try {
    let uri;
    if (process.env.NODE_ENV === 'development') {
      uri = process.env.MONGO_URI;
    }
    else {
      uri = process.env.MONGO_URI_PROD;
    }
    if (!uri) throw new Error("MONGO_URI environment variable is not set");

    try {
      await mongoose.connect(uri);
    } catch (err) {
      console.error("Initial MongoDB connection failed:", err.message);
      // common issue on Windows: DNS 'localhost' resolves to IPv6 ::1 while mongod listens on 127.0.0.1
      if (uri.includes("localhost")) {
        const fallback = uri.replace("localhost", "127.0.0.1");
        console.log(`Retrying MongoDB connection with ${fallback}`);
        await mongoose.connect(fallback);
      } else {
        throw err;
      }
    }
    if (uri.includes("srv:")) {
      console.log("MongoDB Live Connected");
    }
    else {
      console.log("MongoDB Local Connected");

    }
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
