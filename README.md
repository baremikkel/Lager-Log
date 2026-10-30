# Lager-Log

Lager-Log is a web app for keeping track of products and stock. It provides a barcode-based product entry workflow, inventory management, product categories, and a dedicated fruit and vegetables view.

## Features

- Add products using a barcode, product name, and stock value.
- Submit a list of scanned products and update inventory quantities.
- Browse and edit products and adjust stock.
- Create categories and assign products to them.
- View products in the “Frugt og Grønt” category.

## Technology

- Node.js and TypeScript
- Express and EJS
- PostgreSQL
- Tailwind CSS

## Requirements

- Node.js and npm
- Docker Compose (or a PostgreSQL 15-compatible database)

## Run locally

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Start PostgreSQL and pgAdmin:

   ```sh
   docker compose up -d
   ```

   The Compose configuration provides PostgreSQL on port `5432` and pgAdmin on port `5050`. Its default local-development credentials are `admin` / `password123` for PostgreSQL and `admin@example.com` / `adminpassword` for pgAdmin. Do not use these defaults for a publicly accessible deployment.

3. Configure the app's database connection:

   ```sh
   cp .env.example .env
   ```

   Set the following values in `.env` to match your PostgreSQL instance:

   ```dotenv
   DB_USER=admin
   DB_HOST=localhost
   DB_NAME=storage_database
   DB_PASSWORD=password123
   DB_PORT=5432
   ```

4. Initialize the database schema and default categories:

   ```sh
   docker compose exec -T db psql -U admin -d storage_database < src/services/database/setup.sql
   ```

   Run this after PostgreSQL is ready. The SQL uses `IF NOT EXISTS` and inserts default categories only when they are not already present.

5. Start the development server and asset watchers:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The root path redirects to the scanner.

## Pages

| Path | Description |
| --- | --- |
| `/scanner` | Add products and submit inventory updates |
| `/inventory` | Browse current inventory |
| `/products` | Browse and edit products |
| `/categories` | Manage categories and product assignments |
| `/fruit_vegetables` | Browse products in the fruit and vegetables category |

## Development scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run CSS, frontend, and server watchers with the development server |
| `npm run build:css` | Compile the Tailwind CSS |
| `npm run build:frontend` | Bundle the browser-side TypeScript |
| `npm run build:prod` | Build CSS, frontend assets, and the server bundle |

The server listens on port `3000`, which is currently configured in `src/server.ts`.
