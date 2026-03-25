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

page_router.get('/inventory', (req: Request, res: Response) => {
    res.send("This is the inventory page!");
});

page_router.get('/categories', (req: Request, res: Response) => {
    res.send("This is the categories page!");
});

page_router.get('/products', (req: Request, res: Response) => {
        res.render('products_page', {title: 'Produkter'})

});
    
page_router.get('/fruit_vegetables', (req: Request, res: Response) => {
    res.send("This is the fruit and vegetables page!");
});

export {page_router};