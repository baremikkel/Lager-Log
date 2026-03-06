"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const pages_1 = __importDefault(require("./routes/pages"));
const app = (0, express_1.default)();
const PORT = 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(process.cwd(), 'views'));
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'dist', 'public')));
app.use('/', pages_1.default);
app.listen(PORT, () => {
    console.log(`Server active at http://localhost:${PORT}`);
});
