// src/server.ts
import express from "express";
import path from "path";

// src/routes/pages.ts
import { Router } from "express";
var router = Router();
router.get("/", (req, res) => {
  res.redirect("/home");
});
router.get("/home", (req, res) => {
  res.render("front_page", { title: "Home page" });
});
router.get("/about", (req, res) => {
  res.send("This is the about page!");
});
var pages_default = router;

// src/server.ts
var app = express();
var PORT = 3e3;
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.static(path.join(process.cwd(), "dist", "public")));
app.use("/", pages_default);
app.listen(PORT, () => {
  console.log(`Server active at http://localhost:${PORT}`);
});
