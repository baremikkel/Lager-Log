import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import { Category, Product, QuantityUnit } from './tableInterfaces';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

async function setupDatabase() {
    const client = await pool.connect();
    
    try {
        console.log("Connected to PostgreSQL. Starting schema load...");
        const sqlFilePath = path.resolve(__dirname, 'setup.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found at ${sqlFilePath}`);
        }
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        await client.query(sql);
        
        console.log("Database schema and seed data loaded successfully!");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        client.release();
    }
}

async function getAllProducts(): Promise<Product[]> {
    const {rows} = await pool.query('SELECT * FROM products')
    return rows;
}

async function getAllCategories(): Promise<Category[]> {
    const {rows} = await pool.query('SELECT * FROM categories')
    return rows;
}

async function getAllUnits(): Promise<QuantityUnit[]> {
    const {rows} = await pool.query('SELECT * FROM quantity_units')
    return rows;
}

async function getProductByBarcode(product_barcode: string): Promise<Product> {
    const {rows} = await pool.query('SELECT * FROM products WHERE barcode = ?', [product_barcode])
    return rows[0];
}

async function getProductIdByBarcode(product_barcode: string): Promise<Product> {
    const {rows} = await pool.query('SELECT id FROM products WHERE barcode = ?', [product_barcode])
    return rows[0];
}

async function getUnitById(id: number): Promise<QuantityUnit> {
    const {rows} = await pool.query('SELECT unit FROM quantity_units WHERE id = ?', [id])
    return rows[0];
}

async function getUnitIdByName(unit: string): Promise<QuantityUnit> {
    const {rows} = await pool.query('SELECT id FROM quantity_units WHERE unit = ?', [unit])
    return rows[0];
}


export {setupDatabase};
export default pool;