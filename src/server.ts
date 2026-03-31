import express from 'express';
import path from 'path';
import {page_router} from './routes/pages';
import {api_router} from './routes/api';

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
app.use('/images', express.static(path.join(process.cwd(), 'src', 'public', 'images')));
app.use('/layouts', express.static(path.join(process.cwd(), 'views', 'layouts')));
app.use(express.json());
app.use('/api', api_router);
app.use('/', page_router);
app.listen(PORT, () => {
    console.log(`Server active at http://localhost:${PORT}`);
});