"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var path_1 = require("path");
var app = (0, express_1.default)();
var PORT = 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.resolve(__dirname, '../views'));
app.use(express_1.default.static(path_1.default.resolve(__dirname, 'public')));
app.get('/', function (req, res) {
    var status = {
        name: "Gemini Stack",
        version: "v4.0.0",
        features: ["TypeScript 5.x", "Tailwind CSS v4", "EJS Templates"],
        isOnline: true
    };
    res.render('index', { status: status });
});
