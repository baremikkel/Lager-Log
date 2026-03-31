import { Router, Request, Response } from "express";
import logger from "../logger";
import {
  addNewProduct,
  addToInventory,
  getProductIdByBarcode,
  addCategory,
  updateCategory,
  updateProduct
} from "../services/database/databaseClient";

const api_router = Router();

api_router.post("/scanner", async (req: Request, res: Response) => {
  const barcode = req.body.product_barcode;
  const product_name = req.body.product_name;
  const units_per_item = req.body.units_per_item;
  if (!barcode) {
    return res.status(400).json({ error: "Item code is required" });
  }
  try {
    const newProductId = await addNewProduct(barcode, product_name, units_per_item);
    res.status(200).json({ message: "Item added successfully!", id: newProductId });
  } catch (error) {
    logger.error(`[Backend] Error adding new item: ${error}`);
    return res.status(500).json({ error: "Failed to add new item" });
  }
});

api_router.post("/scanner/list", async (req: Request, res: Response) => {
  const list = req.body;
  logger.info(`[Backend] Received list: ${JSON.stringify(list)}`);
  try {
    req.body.forEach(async (item: any) => {
    const { barcode, count } = item;
    const product = await getProductIdByBarcode(barcode);
    await addToInventory(product.id, count);
  });
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

export { api_router };
