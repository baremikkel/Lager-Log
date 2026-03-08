import { Router, Request, Response } from 'express';
import { hasProductAllready } from '../services/collector';
import logger from '../logger';

const router = Router();

router.get('/scanner', async (req: Request, res: Response) => {
    const barcode = req.query.barcode as string;

    if (!barcode) {
        return res.status(400).json({ error: "Item code is required" });
    }

    logger.info(`[Backend] Received new item: ${barcode}`);
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

export default router;