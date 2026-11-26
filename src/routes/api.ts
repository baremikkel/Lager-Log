import { Router, Request, Response } from "express";
import logger from "../logger";
import {
  addNewProduct,
  addToInventory,
  getProductIdByBarcode,
  addCategory,
  updateCategory,
  updateProduct,
  saveNavSettings,
  saveAppSettings
} from "../services/database/databaseClient";

const api_router = Router();

api_router.post("/scanner", async (req: Request, res: Response) => {
  // has_barcode: false means the product has no barcode; its id is used instead.
  const hasBarcode = req.body.has_barcode !== false;
  const barcode = hasBarcode ? String(req.body.product_barcode ?? "").trim() : null;
  const product_name = req.body.product_name;
  const units_per_item = req.body.units_per_item;
  if (hasBarcode && !barcode) {
    return res.status(400).json({ error: "Item code is required" });
  }
  try {
    const created = await addNewProduct(barcode, product_name, units_per_item);
    res.status(200).json({ message: "Item added successfully!", id: created.id, product_barcode: created.product_barcode });
  } catch (error) {
    logger.error(`[Backend] Error adding new item: ${error}`);
    return res.status(500).json({ error: "Failed to add new item" });
  }
});

api_router.post("/scanner/list", async (req: Request, res: Response) => {
  const list = req.body;
  logger.info(`[Backend] Received list: ${JSON.stringify(list)}`);
  try {
    // Each scan is one package, so add count × pieces per package to the inventory.
    for (const { barcode, count } of list) {
      const product = await getProductIdByBarcode(barcode);
      if (!product) continue;
      const perPackage = Number(product.stock) || 1;
      await addToInventory(product.id, Number(count) * perPackage);
    }
    res.status(200).json({ message: "List received successfully!" });
  } catch (error) {
    logger.error(`[Backend] Error processing list: ${error}`);
    return res.status(500).json({ error: "Failed to process list" });
  }
  
});

api_router.post("/categories", async (req: Request, res: Response) => {
  const categoryName = req.body.name;
  logger.info(`[Backend] Received category name: ${categoryName}`);
  if (!categoryName) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    await addCategory(categoryName);
    res.status(200).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to add category" });
  }
});

api_router.post("/categories/update", async (req: Request, res: Response) => {
  const { selectedProducts, selectedCategories } = req.body;
  logger.info(`[Backend] Received update category request: ${JSON.stringify(req.body)}`);
  if (!selectedProducts || !selectedCategories) {
    return res.status(400).json({ error: "Selected products and categories are required" });
  }
  try {
    await updateCategory(selectedProducts, selectedCategories);
    res.status(200).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to update categories" });
  }
});

api_router.post("/inventory/update", async (req: Request, res: Response) => {
  const { product_id, delta } = req.body;
  if (!product_id || typeof delta !== 'number') {
    return res.status(400).json({ error: "product_id and delta are required" });
  }
  try {
    await addToInventory(product_id, delta);
    res.status(200).json({ message: "Inventory updated successfully!" });
  } catch (error) {
    logger.error(`[Backend] Error updating inventory: ${error}`);
    return res.status(500).json({ error: "Failed to update inventory" });
  }
});

api_router.post("/products/update", async (req: Request, res: Response) => {
  const { product_id, delta } = req.body;
  if (!product_id || typeof delta !== 'number') {
    return res.status(400).json({ error: "product_id and delta are required" });
  }
  try {
    await addToInventory(product_id, delta);
    res.status(200).json({ message: "Inventory updated successfully!" });
  } catch (error) {
    logger.error(`[Backend] Error updating inventory: ${error}`);
    return res.status(500).json({ error: "Failed to update inventory" });
  }
});

api_router.post("/products/edit", async (req: Request, res: Response) => {
  const { id, product_barcode, product_name, stock } = req.body;
  if (!id || !product_barcode || !product_name || typeof stock !== 'number') {
    return res.status(400).json({ error: "id, product_barcode, product_name, and stock are required" });
  }
  try {
    await updateProduct(id, product_barcode, product_name, stock);
    res.status(200).json({ message: "Product updated successfully!" });
  } catch (error) {
    logger.error(`[Backend] Error updating product: ${error}`);
    return res.status(500).json({ error: "Failed to update product" });
  }
});

api_router.post("/fruit_vegetables/update", async (req: Request, res: Response) => {
  const { product_id, delta } = req.body;
  if (!product_id || typeof delta !== 'number') {
    return res.status(400).json({ error: "product_id and delta are required" });
  }
  try {
    await addToInventory(product_id, delta);
    res.status(200).json({ message: "Inventory updated successfully!" });
  } catch (error) {
    logger.error(`[Backend] Error updating inventory: ${error}`);
    return res.status(500).json({ error: "Failed to update inventory" });
  }
});

// Settings page: which categories are shown in the navigation bar, in order.
api_router.post("/settings/nav", async (req: Request, res: Response) => {
  const categories = req.body?.categories;
  const valid =
    Array.isArray(categories) &&
    categories.every((c: any) => Number.isInteger(c?.id) && typeof c?.show_in_nav === "boolean");
  if (!valid) {
    return res.status(400).json({ error: "categories must be a list of { id, show_in_nav }" });
  }
  try {
    await saveNavSettings(categories);
    res.status(200).json({ message: "Settings saved" });
  } catch (error) {
    logger.error(`[Backend] Error saving navigation settings: ${error}`);
    return res.status(500).json({ error: "Failed to save settings" });
  }
});

// Settings page: display settings, e.g. { showBarcodeOnCards: false }.
api_router.post("/settings/display", async (req: Request, res: Response) => {
  const { showBarcodeOnCards } = req.body ?? {};
  if (typeof showBarcodeOnCards !== "boolean") {
    return res.status(400).json({ error: "showBarcodeOnCards must be true or false" });
  }
  try {
    await saveAppSettings({ showBarcodeOnCards });
    res.status(200).json({ message: "Settings saved" });
  } catch (error) {
    logger.error(`[Backend] Error saving display settings: ${error}`);
    return res.status(500).json({ error: "Failed to save settings" });
  }
});

export { api_router };
