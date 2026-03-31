import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";
import { Pool } from "pg";
import { Category, Inventory, Product } from "./tableInterfaces";
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
    const sqlFilePath = path.resolve('./src/services/database', "setup.sql");

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
  const { rows } = await pool.query("SELECT * FROM products");
  return rows;
}

async function getAllCategories(): Promise<Category[]> {
  const { rows } = await pool.query(`
    SELECT 
      categories.id AS category_id,
      categories.name AS category_name,
      products.id AS product_id, 
      products.product_name
    FROM categories
    LEFT JOIN product_categories ON categories.id = product_categories.category_id
    LEFT JOIN products ON product_categories.product_id = products.id
    ORDER BY categories.id;
  `);

  const categoriesMap = rows.reduce((bucket, row) => {
    if (!bucket[row.category_id]) {
      bucket[row.category_id] = {
        id: row.category_id,
        name: row.category_name,
        products: []
      };
    }

    if (row.product_id) {
      bucket[row.category_id].products.push({
        id: row.product_id,
        name: row.product_name
      });
    }

    return bucket;
  }, {} as Record<number, Category>);

  return Object.values(categoriesMap);
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

async function addNewProduct(
  barcode: string,
  title: string,
  stock: number,
) {
  const conn = await pool.connect();
  let newProductId = 0;
  try {
    await conn.query("BEGIN");
    const result = await conn.query("INSERT INTO products (product_barcode, product_name, stock) VALUES ($1, $2, $3) RETURNING id", [barcode, title, stock]);
    newProductId = result.rows[0].id;

    await conn.query("INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)", [newProductId, 1]);

  await conn.query("COMMIT");
  } catch (e) {
    await conn.query("ROLLBACK");
    throw e;
  } finally {
    conn.release();
    return newProductId;
  }
}

async function addToInventory(
  product_id: number,
  amount: number,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO inventory (product_id, product_amount) 
       VALUES ($1, $2)
       ON CONFLICT (product_id) 
       DO UPDATE SET 
         product_amount = inventory.product_amount + EXCLUDED.product_amount`,
      [product_id, amount],
    );

    await client.query(
      `DELETE FROM inventory WHERE product_id = $1 AND product_amount <= 0`,
      [product_id],
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function getInventory(): Promise<Inventory[]> {
  const { rows } = await pool.query(`SELECT 
    p.id,
    p.product_barcode, 
    p.product_name, 
	  p.stock,
    i.product_amount
    FROM inventory AS i
    JOIN products AS p ON i.product_id = p.id;`);
  return rows;
}

async function addCategory(categoryName: string) {
    const row = await pool.query("INSERT INTO categories (name) VALUES ($1)", [categoryName]);
    return row;
}

async function updateCategory(productNames: string[], categoryNames: string[]) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const categoryIdsResult = await client.query(
            `SELECT id FROM categories WHERE name = ANY($1)`,
            [categoryNames],
        );
        const categoryIds = categoryIdsResult.rows.map((row) => row.id);
        const productIdsResult = await client.query(
            `SELECT id FROM products WHERE product_name = ANY($1)`,
            [productNames],
        );
        const productIds = productIdsResult.rows.map((row) => row.id);
        
        // Remove all existing categories for these products
        await client.query(
            `DELETE FROM product_categories WHERE product_id = ANY($1)`,
            [productIds],
        );
        
        for (const categoryId of categoryIds) {
            for (const productId of productIds) {
                await client.query(
                    `INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [productId, categoryId],
                );
            }
        }
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

async function getFruitAndVegetables(): Promise<Product[]> { 
  const { rows } = await pool.query(`SELECT p.id, p.product_barcode, p.product_name, inventory.product_amount AS stock
  FROM products p
  JOIN product_categories pc ON p.id = pc.product_id
  JOIN categories c ON pc.category_id = c.id
  LEFT JOIN inventory ON p.id = inventory.product_id
  WHERE c.name = $1`, ['Frugt og Grønt']);
  return rows;
}

export {
  setupDatabase,
  getAllProducts,
  getAllCategories,
  getProductByBarcode,
  getProductIdByBarcode,
  addNewProduct,
  addToInventory,
  getInventory,
  addCategory,
  updateCategory,
  getFruitAndVegetables,
};
export default pool;
