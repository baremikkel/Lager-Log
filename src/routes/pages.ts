import { Router, Request, Response } from 'express';
import { getAllCategories, getAllProducts, getAllUnits } from '../services/database/databaseClient';
import { log } from 'node:console';
import logger from '../logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.redirect('/scanner')
});

router.get('/scanner', async (req: Request, res: Response)=> {
    const units = await getAllUnits();
    const products = await getAllProducts();
    const categories = await getAllCategories();
    const payload = {
        units: units,
        products: products,
        categories: categories
    }
    res.render('scanner_page', {title: 'Scanner', payload: payload})
})

router.get('/about', (req: Request, res: Response) => {
    res.send("This is the about page!");
});

export default router;