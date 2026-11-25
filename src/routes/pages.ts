import { Router, Request, Response } from 'express';
import { getAllCategories, getAllProducts, getAllProductsWithCategories, getCategoryById, getCategoryIdByName, getNavSettings, getProductsInCategory } from '../services/database/databaseClient';
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
    const inventory = await getAllProductsWithCategories();
    res.render('inventory_page', {title: 'Lager', items: inventory});
});

page_router.get('/categories', async (req: Request, res: Response) => {
    const categories = await getAllCategories();
    res.render('category_page', {title: 'Kategorier', categories: Array.isArray(categories) ? categories : []});
});

page_router.get('/products', async (req: Request, res: Response) => {
    const products = await getAllProductsWithCategories();
    res.render('products_page', {title: 'Produkter', products: Array.isArray(products) ? products : []});
});
    
// A page per category; the categories shown in the navigation bar link here.
page_router.get('/category/:id', async (req: Request, res: Response) => {
    const category = await getCategoryById(Number(req.params.id));
    if (!category) return res.redirect('/products');
    const products = await getProductsInCategory(category.id);
    res.render('category_products_page', {title: category.name, products: products});
});

// Old address of the "Frugt og Grønt" page, kept so bookmarks still work.
page_router.get('/fruit_vegetables', async (req: Request, res: Response) => {
    const id = await getCategoryIdByName('Frugt og Grønt');
    res.redirect(id ? `/category/${id}` : '/products');
});

page_router.get('/settings', async (req: Request, res: Response) => {
    const categories = await getNavSettings();
    res.render('settings_page', {title: 'Indstillinger', categories: categories});
});

export {page_router};