import { Router, Request, Response } from 'express';
import logger from '../logger';

const router = Router();

router.get('/scanner', (req: Request, res: Response) => {
    const barcode = req.query.barcode as string;

    if (!barcode) {
        return res.status(400).json({ error: "Item name is required" });
    }

    logger.info(`[Backend] Received new item: ${barcode}`);
    

    res.status(201).json({ 
        message: "Item added successfully!",
        data: { id: Date.now(), name: barcode }
    });
});

export default router;