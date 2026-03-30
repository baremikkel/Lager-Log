import { Router, Request, Response } from 'express';
import { getAllCategories, getAllProducts, getInventory } from '../services/database/databaseClient';
import logger from '../logger';

const page_router = Router();

page_router.get('/', (req: Request, res: Response) => {
    res.redirect('/scanner')
});

page_router.get('/scanner', async (req: Request, res: Response)=> {
    const products = await getAllProducts();
    res.render('scanner_page', {title: 'Scanner', products: products})
})

page_router.get('/inventory', async (req: Request, res: Response) => {
    const inventory = await getInventory();
    logger.info(`[Backend] Inventory data: ${JSON.stringify(inventory)}`);
    res.render('inventory_page', {title: 'Lager', items: inventory});
});

page_router.get('/categories', async (req: Request, res: Response) => {
    const categories = await getAllCategories();
    res.render('categories_page', {title: 'Kategorier', categories: Array.isArray(categories) ? categories : []});
});

page_router.get('/products', async (req: Request, res: Response) => {
    const products = await getAllProducts();
    res.render('products_page', {title: 'Produkter', products: Array.isArray(products) ? products : []});
});
    
page_router.get('/fruit_vegetables', async (req: Request, res: Response) => {
    res.send("This is the fruit and vegetables page!");
});

export {page_router};