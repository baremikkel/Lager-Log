import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.redirect('/scanner')
});

router.get('/scanner', (req: Request, res: Response)=> {
    res.render('scanner_page', {title: 'Scanner'})
})

router.get('/about', (req: Request, res: Response) => {
    res.send("This is the about page!");
});

export default router;