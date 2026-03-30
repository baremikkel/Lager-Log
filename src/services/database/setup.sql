CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_barcode TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    stock NUMERIC NOT NULL,
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

-- Standard units and categories
INSERT INTO quantity_units (unit) 
VALUES ('stk'), ('g'), ('ml'), ('spsk'), ('tsk')
ON CONFLICT (unit) DO NOTHING;

INSERT INTO categories (name) 
VALUES ('Frugt og Grønt'), ('Mejeri'), ('Kød og Fisk')
ON CONFLICT (name) DO NOTHING;