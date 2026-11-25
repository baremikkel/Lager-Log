CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_barcode TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    stock NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    product_amount NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    recipe_title TEXT NOT NULL,
    std_serving_size INTEGER NOT NULL,
    recipe_steps TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    amount REAL NOT NULL, 
    note TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

INSERT INTO categories (name) 
VALUES ('Ukategoriseret'),('Frugt og Grønt'), ('Mejeri'), ('Kød og Fisk')
ON CONFLICT (name) DO NOTHING;

-- Which categories get their own link in the navigation bar, and in which order
-- (chosen on the "Indstillinger" page). The first time the columns are added,
-- "Frugt og Grønt" is shown so the navigation looks like it did before.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'show_in_nav'
    ) THEN
        ALTER TABLE categories ADD COLUMN show_in_nav BOOLEAN NOT NULL DEFAULT false;
        UPDATE categories SET show_in_nav = true WHERE name = 'Frugt og Grønt';
    END IF;
END $$;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS nav_position INTEGER;
