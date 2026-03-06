import express from 'express';
import path from 'path';
import pageRoutes from './routes/pages';

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
app.use('/', pageRoutes);

app.listen(PORT, () => {
    console.log(`Server active at http://localhost:${PORT}`);
});