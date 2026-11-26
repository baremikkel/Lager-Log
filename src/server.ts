import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import net from 'net';
import path from 'path';
import {page_router} from './routes/pages';
import {api_router} from './routes/api';
import { getAppSettings, getNavCategories, setupDatabase } from './services/database/databaseClient';

const app = express();
const PORT = 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;
const { SSL_KEY_FILE, SSL_CERT_FILE } = process.env;
const httpsEnabled = Boolean(SSL_KEY_FILE && SSL_CERT_FILE);

// HTTPS_REDIRECT=true sends plain http visitors to the https address, so the camera
// (which browsers only allow over https) works whichever address people type.
// localhost keeps working over http, since browsers allow the camera there.
if (httpsEnabled && process.env.HTTPS_REDIRECT === 'true') {
    app.use((req, res, next) => {
        if (req.secure || req.hostname === 'localhost' || req.hostname === '127.0.0.1') return next();
        res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.originalUrl}`);
    });
}

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
app.use('/images', express.static(path.join(process.cwd(), 'src', 'public', 'images')));
app.use('/layouts', express.static(path.join(process.cwd(), 'views', 'layouts')));
app.use(express.json());
app.use('/api', api_router);
// Every page needs the choices from the settings page: the categories in the navigation
// bar, and display settings such as whether product cards show the barcode.
app.use(async (req, res, next) => {
    try {
        [res.locals.navCategories, res.locals.appSettings] = await Promise.all([getNavCategories(), getAppSettings()]);
    } catch (error) {
        console.error('Could not load settings:', error);
        res.locals.navCategories = res.locals.navCategories ?? [];
        res.locals.appSettings = { showBarcodeOnCards: true };
    }
    next();
});
app.use('/', page_router);
app.listen(PORT, () => {
    console.log(`Server active at http://localhost:${PORT}`);
});

// Optional HTTPS: browsers only allow camera access over HTTPS (or on localhost).
if (httpsEnabled) {
    const credentials = {
        key: fs.readFileSync(SSL_KEY_FILE!),
        cert: fs.readFileSync(SSL_CERT_FILE!),
    };
    const httpsServer = https.createServer(credentials, app);

    // Phones often add "http://" when only "192.168.x.x:3443" is typed, and an HTTPS port
    // answers that with nothing ("This page isn't working"). So the port looks at the first
    // byte of each connection: a TLS handshake (0x16) goes to the HTTPS server, anything else
    // gets sent on to the same address with https://.
    const toHttps = http.createServer((req, res) => {
        const host = req.headers.host ?? `localhost:${HTTPS_PORT}`;
        res.writeHead(302, { Location: `https://${host}${req.url ?? '/'}` });
        res.end();
    });

    net.createServer((socket) => {
        socket.once('data', (firstChunk) => {
            socket.pause();
            socket.unshift(firstChunk);
            const target = firstChunk[0] === 0x16 ? httpsServer : toHttps;
            target.emit('connection', socket);
            process.nextTick(() => socket.resume());
        });
        socket.on('error', () => socket.destroy());
    }).listen(HTTPS_PORT, () => {
        console.log(`HTTPS server active at https://localhost:${HTTPS_PORT}`);
    });
}