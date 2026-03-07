// src/server.ts
import express from "express";
import path from "path";

// src/routes/pages.ts
import { Router } from "express";
var router = Router();
router.get("/", (req, res) => {
  res.redirect("/scanner");
});
router.get("/scanner", (req, res) => {
  res.render("scanner_page", { title: "Scanner" });
});
router.get("/about", (req, res) => {
  res.send("This is the about page!");
});
var pages_default = router;

// src/routes/api.ts
import { Router as Router2 } from "express";

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
router2.get("/scanner", (req, res) => {
  const barcode = req.query.barcode;
  if (!barcode) {
    return res.status(400).json({ error: "Item name is required" });
  }
  logger_default.info(`[Backend] Received new item: ${barcode}`);
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
app.use(express.json());
app.use("/api", api_default);
app.use("/", pages_default);
app.listen(PORT, () => {
  console.log(`Server active at http://localhost:${PORT}`);
});
