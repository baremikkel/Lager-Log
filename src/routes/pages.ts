import { Router, Request, Response } from 'express';
import { getAllCategories, getAllProducts, getAllUnits } from '../services/database/databaseClient';
import logger from '../logger';

const page_router = Router();

page_router.get('/', (req: Request, res: Response) => {
    res.redirect('/scanner')
});

page_router.get('/scanner', async (req: Request, res: Response)=> {
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

page_router.get('/about', (req: Request, res: Response) => {
    res.send("This is the about page!");
});

export {page_router};