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
  const { rows } = await pool.query("SELECT *, inventory.product_amount FROM products LEFT JOIN inventory ON products.id = inventory.product_id");
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
    "SELECT id, stock FROM products WHERE product_barcode = $1",
    [product_barcode],
  );
  return rows[0];
}

/**
 * Creates a product in the "Ukategoriseret" category. When `barcode` is null the
 * product has no barcode, and its own id is used as product_barcode instead.
 */
async function addNewProduct(
  barcode: string | null,
  title: string,
  stock: number,
): Promise<{ id: number; product_barcode: string }> {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    // Reserve the id first so it can also be used as the barcode in the same insert.
    const result = await conn.query(
      `WITH next AS (SELECT nextval(pg_get_serial_sequence('products', 'id')) AS id)
       INSERT INTO products (id, product_barcode, product_name, stock)
       SELECT id, COALESCE($1, id::text), $2, $3 FROM next
       RETURNING id, product_barcode`,
      [barcode, title, stock],
    );
    const created = result.rows[0];

    await conn.query("INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)", [created.id, 1]);

    await conn.query("COMMIT");
    return created;
  } catch (e) {
    await conn.query("ROLLBACK");
    throw e;
  } finally {
    conn.release();
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
    JOIN products AS p ON i.product_id = p.id`);
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

async function getAllProductsWithCategories() {
  const { rows } = await pool.query(`
    SELECT 
      p.id,
      p.product_barcode,
      p.product_name,
      p.stock,
      i.product_amount,
      COALESCE(json_agg(DISTINCT c.name), '[]'::json) as categories
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN categories c ON pc.category_id = c.id
    GROUP BY p.id, p.product_barcode, p.product_name, p.stock, i.product_amount
  `);
  return rows;
}

export interface NavCategory {
  id: number;
  name: string;
  show_in_nav: boolean;
}

/** All categories in navigation order: chosen order first, then the rest by id. */
async function getNavSettings(): Promise<NavCategory[]> {
  const { rows } = await pool.query(
    `SELECT id, name, show_in_nav FROM categories ORDER BY nav_position NULLS LAST, id`,
  );
  return rows;
}

/** The categories that get a link in the navigation bar, in order. */
async function getNavCategories(): Promise<NavCategory[]> {
  return (await getNavSettings()).filter((category) => category.show_in_nav);
}

/** Saves which categories are shown in the navigation bar; the array order is the nav order. */
async function saveNavSettings(categories: { id: number; show_in_nav: boolean }[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [position, category] of categories.entries()) {
      await client.query(
        "UPDATE categories SET show_in_nav = $1, nav_position = $2 WHERE id = $3",
        [category.show_in_nav, position, category.id],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function getCategoryById(id: number): Promise<{ id: number; name: string } | null> {
  const { rows } = await pool.query("SELECT id, name FROM categories WHERE id = $1", [id]);
  return rows[0] ?? null;
}

async function getCategoryIdByName(name: string): Promise<number | null> {
  const { rows } = await pool.query("SELECT id FROM categories WHERE name = $1", [name]);
  return rows[0]?.id ?? null;
}

/** All products in one category, with their inventory amount and all their categories. */
async function getProductsInCategory(categoryId: number): Promise<Product[]> {
  const { rows } = await pool.query(`
    SELECT
      p.id,
      p.product_barcode,
      p.product_name,
      p.stock,
      inventory.product_amount,
      COALESCE(json_agg(DISTINCT c.name), '[]'::json) as categories
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    JOIN categories c ON pc.category_id = c.id
    LEFT JOIN inventory ON p.id = inventory.product_id
    WHERE p.id IN (SELECT product_id FROM product_categories WHERE category_id = $1)
    GROUP BY p.id, p.product_barcode, p.product_name, p.stock, inventory.product_amount
  `, [categoryId]);
  return rows;
}

async function updateProduct(id: number, product_barcode: string, product_name: string, stock: number) {
  const result = await pool.query(
    "UPDATE products SET product_barcode = $1, product_name = $2, stock = $3 WHERE id = $4",
    [product_barcode, product_name, stock, id]
  );
  return result;
}

export {
  setupDatabase,
  getAllProducts,
  getAllProductsWithCategories,
  getAllCategories,
  getProductByBarcode,
  getProductIdByBarcode,
  addNewProduct,
  addToInventory,
  getInventory,
  addCategory,
  updateCategory,
  getNavSettings,
  getNavCategories,
  saveNavSettings,
  getCategoryById,
  getCategoryIdByName,
  getProductsInCategory,
  updateProduct,
};
export default pool;
