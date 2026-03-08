// src/server.ts
import express from "express";
import path from "path";

// src/routes/pages.ts
import { Router } from "express";

// src/services/database/databaseClient.ts
import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();
var pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432
});
async function getAllProducts() {
  const { rows } = await pool.query("SELECT * FROM products");
  return rows;
}
async function getAllCategories() {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
}
async function getAllUnits() {
  const { rows } = await pool.query("SELECT * FROM quantity_units");
  return rows;
}
async function getProductByBarcode(product_barcode) {
  const { rows } = await pool.query("SELECT * FROM products WHERE product_barcode = $1", [product_barcode]);
  if (rows.length === 0) {
    return false;
  }
  return rows[0];
}

// src/routes/pages.ts
var router = Router();
router.get("/", (req, res) => {
  res.redirect("/scanner");
});
router.get("/scanner", async (req, res) => {
  const units = await getAllUnits();
  const products = await getAllProducts();
  const categories = await getAllCategories();
  const payload = {
    units,
    products,
    categories
  };
  res.render("scanner_page", { title: "Scanner", payload });
});
router.get("/about", (req, res) => {
  res.send("This is the about page!");
});
var pages_default = router;

// src/routes/api.ts
import { Router as Router2 } from "express";

// src/services/collector.ts
async function hasProductAllready(barcode) {
  const containProduct = await getProductByBarcode(barcode);
  if (!containProduct) {
    return false;
  }
  return true;
}

// src/logger.ts
import pino from "pino";
var transport = pino.transport({
  target: "pino-pretty",
  level: process.env.LOG_LEVEL || "info"
});
var logger = pino(transport);
var logger_default = logger;

// src/routes/api.ts
var router2 = Router2();
router2.get("/scanner", async (req, res) => {
  const barcode = req.query.barcode;
  if (!barcode) {
    return res.status(400).json({ error: "Item code is required" });
  }
  logger_default.info(`[Backend] Received new item: ${barcode}`);
  const checker = await hasProductAllready(barcode);
  if (!checker) {
    res.status(200).json({ message: "Item not found" });
    return;
  }
  res.status(201).json({
    message: "Item added successfully!",
    data: { id: Date.now(), name: barcode }
  });
});
var api_default = router2;

// src/server.ts
var app = express();
var PORT = 3e3;
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.static(path.join(process.cwd(), "dist", "public")));
app.use("/images", express.static(path.join(process.cwd(), "src", "public", "images")));
app.use(express.json());
app.use("/api", api_default);
app.use("/", pages_default);
app.listen(PORT, () => {
  console.log(`Server active at http://localhost:${PORT}`);
});
