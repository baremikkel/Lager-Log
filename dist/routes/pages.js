import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => {
    res.redirect('/home');
});
router.get('/home', (req, res) => {
    res.render('front_page', { title: 'Home page' });
});
router.get('/about', (req, res) => {
    res.send("This is the about page!");
});
export default router;
