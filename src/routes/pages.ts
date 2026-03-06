import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.redirect('/home')
});

router.get('/home', (req: Request, res: Response)=> {
    res.render('front_page', {title: 'Home page'})
})

router.get('/about', (req: Request, res: Response) => {
    res.send("This is the about page!");
});

export default router;