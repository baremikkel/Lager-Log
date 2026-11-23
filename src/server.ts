import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import {page_router} from './routes/pages';
import {api_router} from './routes/api';
import { setupDatabase } from './services/database/databaseClient';

const app = express();
const PORT = 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

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

// Optional HTTPS: browsers only allow camera access over HTTPS (or on localhost).
const { SSL_KEY_FILE, SSL_CERT_FILE } = process.env;
if (SSL_KEY_FILE && SSL_CERT_FILE) {
    const credentials = {
        key: fs.readFileSync(SSL_KEY_FILE),
        cert: fs.readFileSync(SSL_CERT_FILE),
    };
    https.createServer(credentials, app).listen(HTTPS_PORT, () => {
        console.log(`HTTPS server active at https://localhost:${HTTPS_PORT}`);
    });
}