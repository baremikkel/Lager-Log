import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';

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

export {setupDatabase};
export default pool;