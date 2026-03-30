import { Router, Request, Response } from "express";
import logger from "../logger";
import {
  addNewProduct,
  addToInventory,
  getProductIdByBarcode,
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
    await addNewProduct(barcode, product_name, units_per_item);
    res.status(200).json({ message: "Item added successfully!" });
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

export { api_router };
