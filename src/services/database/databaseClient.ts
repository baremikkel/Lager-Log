import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";
import { Pool } from "pg";
import { Category, Product, QuantityUnit } from "./tableInterfaces";
import logger from "../../logger";

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
    const sqlFilePath = path.resolve(__dirname, "setup.sql");

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at ${sqlFilePath}`);
    }
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    await client.query(sql);

    console.log("Database schema and seed data loaded successfully!");
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
  }
}

async function getAllProducts(): Promise<Product[]> {
  const { rows } = await pool.query(`SELECT
    p.id,
    p.product_name, 
    p.product_barcode,
    p.stock,
    p.std_unit_id,
    q.unit 
    FROM products AS p
    INNER JOIN quantity_units AS q ON p.std_unit_id = q.id`);
  return rows;
}

async function getAllCategories(): Promise<Category[]> {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
}

async function getAllUnits(): Promise<QuantityUnit[]> {
  const { rows } = await pool.query("SELECT * FROM quantity_units");
  return rows;
}

async function getProductByBarcode(
  product_barcode: string,
): Promise<Product | false> {
  const { rows } = await pool.query(
    "SELECT * FROM products WHERE product_barcode = $1",
    [product_barcode],
  );

  if (rows.length === 0) {
    return false;
  }

  return rows[0] as Product;
}

async function getProductIdByBarcode(
  product_barcode: string,
): Promise<Product> {
  const { rows } = await pool.query(
    "SELECT id FROM products WHERE product_barcode = $1",
    [product_barcode],
  );
  return rows[0];
}

async function getUnitById(id: number): Promise<QuantityUnit> {
  const { rows } = await pool.query(
    "SELECT unit FROM quantity_units WHERE id = $1",
    [id],
  );
  return rows[0];
}

async function getUnitIdByName(unit: string): Promise<QuantityUnit> {
  const { rows } = await pool.query(
    "SELECT id FROM quantity_units WHERE unit = $1",
    [unit],
  );
  return rows[0];
}

async function addNewProduct(
  barcode: string,
  title: string,
  stock: number,
  unitId: number,
) {
  await pool.query(
    "INSERT INTO products (product_barcode, product_name, stock, std_unit_id) VALUES ($1, $2, $3, $4)",
    [barcode, title, stock, unitId],
  );
}

async function addToInventory(product_id: number, unit_id: number, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO inventory (product_id, std_unit_id, product_amount) 
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id) 
       DO UPDATE SET 
         product_amount = inventory.product_amount + EXCLUDED.product_amount,
         std_unit_id = EXCLUDED.std_unit_id`,
      [product_id, unit_id, amount]
    );

    await client.query(
      `DELETE FROM inventory WHERE product_id = $1 AND product_amount <= 0`,
      [product_id]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export {
  setupDatabase,
  getAllProducts,
  getAllCategories,
  getAllUnits,
  getProductByBarcode,
  getProductIdByBarcode,
  getUnitById,
  getUnitIdByName,
  addNewProduct,
  addToInventory,
};
export default pool;
