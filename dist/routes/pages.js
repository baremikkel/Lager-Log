"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.redirect('/home');
});
router.get('/home', (req, res) => {
    res.render('front_page', { title: 'Home page' });
});
router.get('/about', (req, res) => {
    res.send("This is the about page!");
});
exports.default = router;
