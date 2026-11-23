# Lager-Log

Lager-Log is a web app for keeping track of products and stock. You scan barcodes, using a handheld scanner, the keyboard, or the camera on a phone or tablet, to build a list of products and then submit it to update the stock. The app also handles product editing, categories, and a dedicated fruit and vegetables view, and it is built to be usable on phones.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration (`.env`)](#configuration-env)
- [Manual setup](#manual-setup)
- [Using the camera on a phone or tablet (HTTPS)](#using-the-camera-on-a-phone-or-tablet-https)
- [Production build](#production-build)
- [npm commands](#npm-commands)
- [Pages](#pages)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Features

- **Scanner page:** add products by barcode using a handheld barcode scanner, the keyboard, or the device camera.
  - Switch between *add* and *remove* mode.
  - Unknown barcodes open a form to create the product.
  - The scanned list can be adjusted with + / − before it is sent to update stock.
- **Camera scanning:** reads EAN/UPC, Code 128/39 and ITF barcodes. It uses the browser's built-in barcode detector where available (Chrome on Android) and falls back to ZXing elsewhere. The scanned list and the main buttons are available inside the camera view.
- **Inventory and products:** browse, search and edit products and adjust stock.
- **Categories:** create categories and assign products to them.
- **Fruit and vegetables:** a view of the products in the "Frugt og Grønt" category.
- **Phone-friendly layout:** large touch targets, a swipeable navigation bar, and bottom-sheet forms.

## Technology

- Node.js and TypeScript, bundled with esbuild
- Express and EJS templates
- PostgreSQL 15 (run with Docker Compose), with pgAdmin for browsing the database
- Tailwind CSS 4
- ZXing / the browser BarcodeDetector API for camera scanning

## Requirements

| | Linux | Windows |
| --- | --- | --- |
| **Node.js 20 or newer** (includes npm) | From your package manager or [nodejs.org](https://nodejs.org) | Installer from [nodejs.org](https://nodejs.org) (LTS) |
| **Docker with Compose** | [Docker Engine](https://docs.docker.com/engine/install/) and the Compose plugin | [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running) |
| **Git** | From your package manager | [Git for Windows](https://git-scm.com/download/win) |
| **OpenSSL** (only for HTTPS / camera on other devices) | Usually preinstalled | Included with Git for Windows |

Check that everything is installed:

```sh
node --version
npm --version
docker compose version
```

You can skip Docker if you already have a PostgreSQL 15-compatible database. See [Manual setup](#manual-setup).

## Quick start

The same commands work on Linux and Windows (PowerShell or Command Prompt).

1. **Get the code:**

   ```sh
   git clone https://github.com/baremikkel/Lager-Log.git
   cd Lager-Log
   ```

2. **Create `.env`.** Copy the example file:

   | Linux | Windows (PowerShell) |
   | --- | --- |
   | `cp .env.example .env` | `Copy-Item .env.example .env` |

   Open `.env` and fill in the values. See [Configuration](#configuration-env).

3. **Start everything:**

   ```sh
   npm start
   ```

   `npm start` runs [`scripts/start.mjs`](scripts/start.mjs), which:

   1. checks that Node.js and Docker are available and that Docker is running,
   2. checks that `.env` exists and has the required values (if `.env` is missing, it creates one from `.env.example` and asks you to fill it in),
   3. starts PostgreSQL and pgAdmin with `docker compose up -d`,
   4. waits until the database is ready,
   5. creates the tables and default categories (safe to run every time),
   6. runs `npm install` if `node_modules` is missing,
   7. starts the development server with `npm run dev`.

4. Open [http://localhost:3000](http://localhost:3000). pgAdmin is at [http://localhost:5050](http://localhost:5050).

Stop the app with **Ctrl+C**. The database keeps running in the background; stop it with `docker compose stop`.

## Configuration (`.env`)

Both the app and `docker-compose.yml` read `.env`, so the database is created with the same credentials that the app uses to connect. `.env` is ignored by git. **Never commit it.** Only `.env.example`, which has no secrets, belongs in the repository.

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `DB_USER` | yes | app, Docker | PostgreSQL user, e.g. `admin` |
| `DB_PASSWORD` | yes | app, Docker | PostgreSQL password; choose your own |
| `DB_NAME` | yes | app, Docker | Database name, e.g. `storage_database` |
| `DB_HOST` | yes | app | `localhost` when using Docker Compose on the same machine |
| `DB_PORT` | yes | app, Docker | Default `5432` |
| `PGADMIN_EMAIL` | with Docker | Docker | Login email for pgAdmin, e.g. `admin@example.com` |
| `PGADMIN_PASSWORD` | with Docker | Docker | Login password for pgAdmin |
| `SSL_KEY_FILE` | no | app | Path to the HTTPS private key, e.g. `certs/key.pem` |
| `SSL_CERT_FILE` | no | app | Path to the HTTPS certificate, e.g. `certs/cert.pem` |
| `HTTPS_PORT` | no | app | HTTPS port, default `3443` |

Example:

```dotenv
DB_USER=admin
DB_HOST=localhost
DB_NAME=storage_database
DB_PASSWORD=choose-a-password
DB_PORT=5432

PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=choose-another-password

# Optional, see "Using the camera on a phone or tablet"
SSL_KEY_FILE=certs/key.pem
SSL_CERT_FILE=certs/cert.pem
HTTPS_PORT=3443
```

> **Note:** PostgreSQL applies `DB_USER`, `DB_PASSWORD` and `DB_NAME` only the first time it creates its data volume. Changing them in `.env` afterwards does not change the existing database. See [Troubleshooting](#troubleshooting).

## Manual setup

To run each step yourself instead of using `npm start`, follow these steps. The commands are the same on Linux and in Windows PowerShell unless shown otherwise.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create and fill in `.env` (see [Quick start](#quick-start), step 2).

3. Start PostgreSQL and pgAdmin:

   ```sh
   docker compose up -d
   ```

   Compose stops with an error such as `Set DB_PASSWORD in .env` if a required value is missing.

4. Create the tables and default categories. Wait a few seconds after the previous step so the database is ready:

   ```sh
   docker compose cp src/services/database/setup.sql db:/tmp/setup.sql
   docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/setup.sql'
   ```

   The SQL uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`, so it is safe to run again. `NOTICE: relation ... already exists, skipping` messages are expected.

   > Windows: run these in **PowerShell**. In Command Prompt (`cmd`), the single quotes in the second command do not work.

5. Start the development server and the CSS/frontend/server watchers:

   ```sh
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). The root path redirects to the scanner.

**Using your own PostgreSQL instead of Docker:** point the `DB_*` values in `.env` at your database, run `src/services/database/setup.sql` against it once (with `psql`, pgAdmin or any SQL tool), and start with:

```sh
npm start -- --no-docker
```

## Using the camera on a phone or tablet (HTTPS)

Browsers only allow camera access on `https://` pages or on `localhost`. To scan with a phone or tablet on the same network, the app has to be served over HTTPS:

1. **Create a self-signed certificate.** It covers `localhost` and this computer's current network IP addresses:

   ```sh
   npm run cert
   ```

   The certificate is written to `certs/`, which is ignored by git. Run this command again if the computer's IP address changes.

2. **Enable HTTPS in `.env`:**

   ```dotenv
   SSL_KEY_FILE=certs/key.pem
   SSL_CERT_FILE=certs/cert.pem
   ```

   Restart the app. It now listens on both `http://localhost:3000` and `https://<ip>:3443`.

3. **Find this computer's IP address:**

   | Linux | Windows |
   | --- | --- |
   | `hostname -I` | `ipconfig` (look for "IPv4 Address") |

4. **Allow the port through the firewall** if the phone cannot connect:

   | Linux (ufw) | Windows (PowerShell **as administrator**) |
   | --- | --- |
   | `sudo ufw allow 3443/tcp` | `New-NetFirewallRule -DisplayName "Lager-Log HTTPS" -Direction Inbound -Protocol TCP -LocalPort 3443 -Action Allow` |

5. **On the phone,** open `https://<ip>:3443/scanner`. The browser warns that the connection is not private, because the certificate is self-signed. Choose *Advanced* → *Proceed* (on iPhone: *Show Details* → *visit this website*). Then tap **📷 Kamera** and allow camera access.

Scanning tips:

- Hold the phone 15–20 cm from the barcode; many phone cameras cannot focus closer.
- The aim box turns green when a barcode is read. Scanning pauses for 1.5 s after each read.
- The same barcode only counts again after it has been out of view for a moment, so holding an item in front of the camera never counts it twice.

## Production build

```sh
npm run start:prod
```

This runs the same checks and database setup as `npm start`, then builds minified assets and the server bundle (`npm run build:prod`) and runs `node dist/server.js`, with no watchers or auto-restart.

## npm commands

All commands work on both Linux and Windows.

| Command | Description |
| --- | --- |
| `npm start` | Check setup, start the database, create tables, and run the dev server |
| `npm run start:prod` | Same checks, then build and run the production version |
| `npm start -- --no-docker` | Same as `npm start`, but use your own PostgreSQL instead of Docker |
| `npm run dev` | Run the CSS, frontend and server watchers with auto-restart (database must already be running) |
| `npm run cert` | Generate a self-signed HTTPS certificate in `certs/` |
| `npm run build:css` | Compile the Tailwind CSS |
| `npm run build:frontend` | Bundle the browser-side TypeScript |
| `npm run build:prod` | Build CSS, frontend assets and the server bundle |

Useful Docker commands (same on both systems):

| Command | Description |
| --- | --- |
| `docker compose stop` | Stop the database and pgAdmin (data is kept) |
| `docker compose logs db` | Show the database log |
| `docker compose down -v` | Remove the containers **and delete all data** |

## Pages

| Path | Description |
| --- | --- |
| `/scanner` | Scan products and submit inventory updates |
| `/inventory` | Browse current inventory |
| `/products` | Browse and edit products |
| `/categories` | Manage categories and product assignments |
| `/fruit_vegetables` | Browse products in the fruit and vegetables category |

The app listens on port `3000` for HTTP (set in `src/server.ts`) and on `HTTPS_PORT` (default `3443`) for HTTPS when a certificate is configured.

## Project structure

```text
src/
  server.ts                 Express server (HTTP + optional HTTPS)
  routes/                   Page routes and JSON API
  services/database/        Database client and setup.sql
  public/ts/                Browser-side TypeScript, bundled to dist/public/js
    scanner_page/camera/    Camera barcode scanner
  public/css/input.css      Tailwind entry point
views/                      EJS templates (pages, layouts, partials)
scripts/
  start.mjs                 npm start / npm run start:prod
  generate-cert.mjs         npm run cert
  build-frontend.mjs        Frontend bundling
docker-compose.yml          PostgreSQL and pgAdmin
```

## Troubleshooting

**"Docker is not running"**
- Windows: start Docker Desktop and wait until it says it is running.
- Linux: `sudo systemctl start docker`. If you get "permission denied", add yourself to the docker group with `sudo usermod -aG docker $USER`, then log out and back in.

**"The database could not be set up" or `password authentication failed`**
The database was first created with different `DB_USER`/`DB_PASSWORD`/`DB_NAME` values than the ones in `.env` now. Either put the original values back in `.env`, or delete the database and start fresh. This **deletes all data**:

```sh
docker compose down -v
npm start
```

**`port is already allocated` / `EADDRINUSE`**
Another program is using port `5432`, `5050`, `3000` or `3443`. Stop it, or change `DB_PORT` / `HTTPS_PORT` in `.env`. Port `3000` is set in `src/server.ts`.

**The camera button says HTTPS is required**
You opened the app over `http://` from another device. Follow [Using the camera on a phone or tablet](#using-the-camera-on-a-phone-or-tablet-https).

**The phone cannot reach `https://<ip>:3443`**
Check that the phone is on the same Wi-Fi network, that you typed `https://`, and that the firewall allows port 3443 (step 4 above). If the IP address has changed, run `npm run cert` again and restart the app.

**`npm run cert` says OpenSSL was not found (Windows)**
Install [Git for Windows](https://git-scm.com/download/win), which includes OpenSSL, or install OpenSSL separately and make sure it is on your `PATH`.
