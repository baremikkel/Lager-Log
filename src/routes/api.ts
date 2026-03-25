import { Router, Request, Response } from 'express';
import logger from '../logger';
import { addNewProduct } from '../services/database/databaseClient';

const api_router = Router();

api_router.post('/scanner', async (req: Request, res: Response) => {
    logger.info('hello there')
    const barcode = req.body.product_barcode;
    const product_name = req.body.product_name;
    const units_per_item = req.body.units_per_item;
    const unit_type = req.body.unit_type;

    if (!barcode) {
        return res.status(400).json({ error: "Item code is required" });
    }

    logger.info(`[Backend] Received new item: ${barcode}`);
    try {
        await addNewProduct(barcode, product_name, units_per_item, unit_type);
        res.status(200).json({ message: "Item added successfully!" });
    } catch (error) {
        logger.error(`[Backend] Error adding new item: ${error}`);
        return res.status(500).json({ error: "Failed to add new item" });
    }
});
export {api_router};